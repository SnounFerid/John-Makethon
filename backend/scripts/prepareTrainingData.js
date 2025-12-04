const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * CSV Data Loader and Preprocessor
 * Converts your Kaggle datasets into format compatible with the ML model
 */
class DataPreparationService {
  constructor() {
    this.trainingDataPath = path.join(__dirname, '../training_data');
    this.outputPath = path.join(__dirname, '../training_data/processed');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Load NAB (Numenta Anomaly Benchmark) data
   * Expected columns: timestamp, value, anomaly_score
   */
  async loadNABData(filePath) {
    console.log('[DATA_PREP] Loading NAB dataset...');
    const data = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Map NAB data to our format
          data.push({
            timestamp: new Date(row.timestamp).getTime(),
            pressure: parseFloat(row.value) || 50,  // Treat value as pressure
            flow: parseFloat(row.value) * 0.2 || 10, // Derive flow
            pressure_rate_of_change: 0,
            flow_rate_of_change: 0,
            pressure_ma_30s: parseFloat(row.value) || 50,
            flow_ma_30s: parseFloat(row.value) * 0.2 || 10,
            pressure_stddev_60s: 0.5,
            flow_stddev_60s: 0.3,
            pressure_flow_ratio: 5,
            hour_of_day: new Date(row.timestamp).getHours(),
            is_weekend: [0, 6].includes(new Date(row.timestamp).getDay()) ? 1 : 0,
            label: parseFloat(row.anomaly_score) > 0 ? 'anomaly' : 'normal'
          });
        })
        .on('end', () => {
          console.log(`[DATA_PREP] ✓ Loaded ${data.length} NAB samples`);
          resolve(data);
        })
        .on('error', reject);
    });
  }

  /**
   * Load Predictive Maintenance data
   * Expected columns: Air temperature, Process temperature, Rotational speed, Torque, Tool wear, Failure Type
   */
  async loadMaintenanceData(filePath) {
    console.log('[DATA_PREP] Loading maintenance dataset...');
    const data = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Map maintenance data to our format
          const hasFailure = row['Failure Type'] && row['Failure Type'] !== 'No Failure';
          
          data.push({
            timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
            pressure: parseFloat(row['Process temperature [K]']) * 0.15 || 50,
            flow: parseFloat(row['Rotational speed [rpm]']) * 0.01 || 10,
            pressure_rate_of_change: parseFloat(row['Torque [Nm]']) * 0.01 || 0,
            flow_rate_of_change: 0,
            pressure_ma_30s: parseFloat(row['Process temperature [K]']) * 0.15 || 50,
            flow_ma_30s: parseFloat(row['Rotational speed [rpm]']) * 0.01 || 10,
            pressure_stddev_60s: parseFloat(row['Tool wear [min]']) * 0.01 || 0.5,
            flow_stddev_60s: 0.3,
            pressure_flow_ratio: 5,
            hour_of_day: Math.floor(Math.random() * 24),
            is_weekend: Math.random() < 0.3 ? 1 : 0,
            label: hasFailure ? 'anomaly' : 'normal'
          });
        })
        .on('end', () => {
          console.log(`[DATA_PREP] ✓ Loaded ${data.length} maintenance samples`);
          resolve(data);
        })
        .on('error', reject);
    });
  }

  /**
   * Load Pump Sensor data
   * Expected columns: timestamp, sensor_00 through sensor_51
   */
  async loadPumpSensorData(filePath) {
    console.log('[DATA_PREP] Loading pump sensor dataset...');
    const data = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Use multiple sensors to derive pressure and flow
          const sensor0 = parseFloat(row.sensor_00) || 0;
          const sensor1 = parseFloat(row.sensor_01) || 0;
          const sensor15 = parseFloat(row.sensor_15) || 0;
          const machineStatus = row.machine_status;
          
          data.push({
            timestamp: new Date(row.timestamp).getTime(),
            pressure: sensor0 * 10 || 50,
            flow: sensor1 * 2 || 10,
            pressure_rate_of_change: (sensor15 - sensor0) * 0.1,
            flow_rate_of_change: 0,
            pressure_ma_30s: sensor0 * 10 || 50,
            flow_ma_30s: sensor1 * 2 || 10,
            pressure_stddev_60s: Math.abs(sensor15 * 0.1) || 0.5,
            flow_stddev_60s: 0.3,
            pressure_flow_ratio: sensor0 / Math.max(0.1, sensor1),
            hour_of_day: new Date(row.timestamp).getHours(),
            is_weekend: [0, 6].includes(new Date(row.timestamp).getDay()) ? 1 : 0,
            label: machineStatus === 'BROKEN' || machineStatus === 'RECOVERING' ? 'anomaly' : 'normal'
          });
        })
        .on('end', () => {
          console.log(`[DATA_PREP] ✓ Loaded ${data.length} pump sensor samples`);
          resolve(data);
        })
        .on('error', reject);
    });
  }

  /**
   * Load Water Quality data
   * Expected columns: ph, Hardness, Solids, Chloramines, Sulfate, Conductivity, Organic_carbon, Trihalomethanes, Turbidity, Potability
   */
  async loadWaterQualityData(filePath) {
    console.log('[DATA_PREP] Loading water quality dataset...');
    const data = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Map water quality to pressure/flow metrics
          const conductivity = parseFloat(row.Conductivity) || 300;
          const hardness = parseFloat(row.Hardness) || 200;
          const turbidity = parseFloat(row.Turbidity) || 3;
          const potable = parseInt(row.Potability) || 0;
          
          data.push({
            timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
            pressure: (conductivity / 10) || 50,
            flow: (hardness / 20) || 10,
            pressure_rate_of_change: 0,
            flow_rate_of_change: 0,
            pressure_ma_30s: (conductivity / 10) || 50,
            flow_ma_30s: (hardness / 20) || 10,
            pressure_stddev_60s: turbidity * 0.2 || 0.5,
            flow_stddev_60s: 0.3,
            pressure_flow_ratio: conductivity / Math.max(1, hardness),
            hour_of_day: Math.floor(Math.random() * 24),
            is_weekend: Math.random() < 0.3 ? 1 : 0,
            label: potable === 0 ? 'anomaly' : 'normal'  // Non-potable = anomaly
          });
        })
        .on('end', () => {
          console.log(`[DATA_PREP] ✓ Loaded ${data.length} water quality samples`);
          resolve(data);
        })
        .on('error', reject);
    });
  }

  /**
   * Combine all datasets and save
   */
  async prepareAllData() {
    console.log('\n' + '═'.repeat(80));
    console.log('[DATA_PREP] Starting data preparation...');
    console.log('═'.repeat(80) + '\n');

    const allData = [];

    // Load each dataset (update paths to your actual files)
    try {
      // NAB Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'nab_data/realKnownCause/ambient_temperature_system_failure.csv'))) {
        const nabData = await this.loadNABData(
          path.join(this.trainingDataPath, 'nab_data/realKnownCause/ambient_temperature_system_failure.csv')
        );
        allData.push(...nabData);
      }

      // Maintenance Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'maintenance_data/predictive_maintenance.csv'))) {
        const maintenanceData = await this.loadMaintenanceData(
          path.join(this.trainingDataPath, 'maintenance_data/predictive_maintenance.csv')
        );
        allData.push(...maintenanceData);
      }

      // Pump Sensor Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'pump_sensor_data/sensor.csv'))) {
        const pumpData = await this.loadPumpSensorData(
          path.join(this.trainingDataPath, 'pump_sensor_data/sensor.csv')
        );
        allData.push(...pumpData);
      }

      // Water Quality Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'water_quality/water_potability.csv'))) {
        const waterData = await this.loadWaterQualityData(
          path.join(this.trainingDataPath, 'water_quality/water_potability.csv')
        );
        allData.push(...waterData);
      }

      console.log('\n' + '═'.repeat(80));
      console.log(`[DATA_PREP] Combined dataset: ${allData.length} total samples`);
      
      // Calculate distribution
      const normalCount = allData.filter(d => d.label === 'normal').length;
      const anomalyCount = allData.filter(d => d.label === 'anomaly').length;
      
      console.log(`  Normal samples: ${normalCount} (${(normalCount/allData.length*100).toFixed(1)}%)`);
      console.log(`  Anomaly samples: ${anomalyCount} (${(anomalyCount/allData.length*100).toFixed(1)}%)`);

      // Save processed data
      const outputFile = path.join(this.outputPath, 'combined_training_data.json');
      fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
      
      console.log(`\n✓ Data saved to: ${outputFile}`);
      console.log('═'.repeat(80) + '\n');

      return allData;

    } catch (error) {
      console.error('[DATA_PREP] Error:', error.message);
      throw error;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const prep = new DataPreparationService();
  prep.prepareAllData()
    .then(() => {
      console.log('✓ Data preparation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('✗ Data preparation failed:', error);
      process.exit(1);
    });
}

module.exports = DataPreparationService;
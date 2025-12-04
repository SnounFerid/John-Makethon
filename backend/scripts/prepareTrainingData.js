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

    // Safe appender: push items one-by-one to avoid creating a huge argument list
    const appendArraySafely = (target, source) => {
      for (let i = 0; i < source.length; i++) {
        target.push(source[i]);
      }
    };

    // Load each dataset (update paths to your actual files)
    try {
      // NAB Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'nab_data/realKnownCause/ambient_temperature_system_failure.csv'))) {
        const nabData = await this.loadNABData(
          path.join(this.trainingDataPath, 'nab_data/realKnownCause/ambient_temperature_system_failure.csv')
        );
        // Append safely to avoid call-stack or argument-list issues
        appendArraySafely(allData, nabData);
      }

      // Maintenance Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'maintenance_data/predictive_maintenance.csv'))) {
        const maintenanceData = await this.loadMaintenanceData(
          path.join(this.trainingDataPath, 'maintenance_data/predictive_maintenance.csv')
        );
        // Append safely to avoid call-stack or argument-list issues
        appendArraySafely(allData, maintenanceData);
      }

      // Pump Sensor Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'pump_sensor_data/sensor.csv'))) {
        const pumpData = await this.loadPumpSensorData(
          path.join(this.trainingDataPath, 'pump_sensor_data/sensor.csv')
        );
        // Append safely to avoid call-stack or argument-list issues
        appendArraySafely(allData, pumpData);
      }

      // Water Quality Data
      if (fs.existsSync(path.join(this.trainingDataPath, 'water_quality/water_potability.csv'))) {
        const waterData = await this.loadWaterQualityData(
          path.join(this.trainingDataPath, 'water_quality/water_potability.csv')
        );
        // Append safely to avoid call-stack or argument-list issues
        appendArraySafely(allData, waterData);
      }

      console.log('\n' + '═'.repeat(80));
      console.log(`[DATA_PREP] Combined dataset: ${allData.length} total samples`);
      
      // Calculate distribution
      const normalCount = allData.filter(d => d.label === 'normal').length;
      const anomalyCount = allData.filter(d => d.label === 'anomaly').length;
      
      console.log(`  Normal samples: ${normalCount} (${(normalCount/allData.length*100).toFixed(1)}%)`);
      console.log(`  Anomaly samples: ${anomalyCount} (${(anomalyCount/allData.length*100).toFixed(1)}%)`);

      // ===== CLASS BALANCING =====
      // Downsample normal data to ~2x anomaly count for better discrimination
      const normalSamples = allData.filter(d => d.label === 'normal');
      const anomalySamples = allData.filter(d => d.label === 'anomaly');
      
      const targetNormalCount = Math.max(anomalySamples.length * 2, 5000);
      const downsampledNormal = normalSamples.slice(0, Math.min(targetNormalCount, normalSamples.length));
      
      const balancedData = [...downsampledNormal, ...anomalySamples];
      
      // Shuffle to mix classes
      for (let i = balancedData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balancedData[i], balancedData[j]] = [balancedData[j], balancedData[i]];
      }
      
      console.log('\n[DATA_PREP] Class Balancing:');
      console.log(`  Original: ${normalCount} normal, ${anomalyCount} anomaly (ratio: ${(normalCount/anomalyCount).toFixed(1)}:1)`);
      console.log(`  Downsampled: ${downsampledNormal.length} normal, ${anomalySamples.length} anomaly (ratio: ${(downsampledNormal.length/anomalySamples.length).toFixed(1)}:1)`);
      console.log(`  Total balanced samples: ${balancedData.length}`);
      
      // ===== ADD ENGINEERED FEATURES =====
      const enhancedData = balancedData.map(sample => {
        // Existing features are kept; add new engineered features
        const pressure = sample.pressure || 50;
        const flow = sample.flow || 10;
        const pressureRate = sample.pressure_rate_of_change || 0;
        const flowRate = sample.flow_rate_of_change || 0;
        const pressureStd = sample.pressure_stddev_60s || 0.5;
        const flowStd = sample.flow_stddev_60s || 0.3;
        
        // New engineered features
        const pressureFlowRatioVar = Math.abs((pressure / Math.max(1, flow)) - 5); // Deviation from normal ratio
        const combinedRateOfChange = Math.abs(pressureRate) + Math.abs(flowRate); // Total rate of change
        const combinedVolatility = pressureStd + flowStd; // Combined std dev
        const flowPressureInteraction = flow * (pressure / 100); // Interaction term
        
        return {
          ...sample,
          // Add new features (don't remove existing ones so model can reuse them)
          pressure_flow_ratio_variance: pressureFlowRatioVar,
          combined_rate_of_change: combinedRateOfChange,
          combined_volatility: combinedVolatility,
          flow_pressure_interaction: flowPressureInteraction
        };
      });
      
      console.log('[DATA_PREP] ✓ Added engineered features: pressure_flow_ratio_variance, combined_rate_of_change, combined_volatility, flow_pressure_interaction');

      // Save processed data
      const outputFile = path.join(this.outputPath, 'combined_training_data.json');
      fs.writeFileSync(outputFile, JSON.stringify(enhancedData, null, 2));
      
      console.log(`\n✓ Data saved to: ${outputFile}`);
      console.log('═'.repeat(80) + '\n');

      return enhancedData;

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
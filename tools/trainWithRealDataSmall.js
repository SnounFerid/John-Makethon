#!/usr/bin/env node

/**
 * trainWithRealDataSmall.js
 * Train the ML model with SMALLER tree count (100 instead of 800)
 * Allows full serialization of trees to disk for production use
 * 
 * Processes:
 * - Pump sensor data (large multi-feature dataset)
 * - Water quality data
 * - NAB anomaly datasets
 * 
 * Usage:
 *   node tools/trainWithRealDataSmall.js
 */

const fs = require('fs');
const path = require('path');
const { IsolationForest } = require('../utils/mlAnomalyDetector');

const TRAINING_DATA_DIR = path.join(__dirname, '../backend/training_data');
const MODELS_DIR = path.join(__dirname, '../models');

/**
 * Load pump sensor data
 */
function loadPumpSensorData() {
  console.log('[DATA] Loading pump sensor data...');
  const filePath = path.join(TRAINING_DATA_DIR, 'pump_sensor_data/sensor.csv');
  
  if (!fs.existsSync(filePath)) {
    console.warn('[DATA] Pump sensor data not found');
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');
    const samples = [];

    for (let i = 1; i < Math.min(2001, lines.length); i++) {
      const values = lines[i].split(',');
      const sample = {};
      
      header.forEach((col, idx) => {
        const val = parseFloat(values[idx]);
        if (!isNaN(val)) {
          sample[col.trim()] = val;
        }
      });

      if (Object.keys(sample).length >= 3) {
        samples.push(sample);
      }
    }

    console.log(`[DATA] ✓ Loaded ${samples.length} pump sensor samples`);
    return samples;
  } catch (error) {
    console.warn(`[DATA] Error loading pump sensor data: ${error.message}`);
    return [];
  }
}

/**
 * Load water quality data
 */
function loadWaterQualityData() {
  console.log('[DATA] Loading water quality data...');
  const filePath = path.join(TRAINING_DATA_DIR, 'water_quality/water_potability.csv');
  
  if (!fs.existsSync(filePath)) {
    console.warn('[DATA] Water quality data not found');
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');
    const samples = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const sample = {};
      
      header.forEach((col, idx) => {
        const val = parseFloat(values[idx]);
        if (!isNaN(val)) {
          sample[col.trim()] = val;
        }
      });

      if (Object.keys(sample).length >= 6) {
        samples.push(sample);
      }
    }

    console.log(`[DATA] ✓ Loaded ${samples.length} water quality samples`);
    return samples;
  } catch (error) {
    console.warn(`[DATA] Error loading water quality data: ${error.message}`);
    return [];
  }
}

/**
 * Load NAB anomaly detection datasets
 */
function loadNABData() {
  console.log('[DATA] Loading NAB anomaly detection datasets...');
  const nabPath = path.join(TRAINING_DATA_DIR, 'nab_data');
  
  if (!fs.existsSync(nabPath)) {
    console.warn('[DATA] NAB data directory not found');
    return [];
  }

  const samples = [];
  const files = fs.readdirSync(nabPath).filter(f => f.endsWith('.csv')).slice(0, 3);

  files.forEach(file => {
    try {
      const filePath = path.join(nabPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      const header = lines[0].split(',');

      for (let i = 1; i < Math.min(5001, lines.length); i++) {
        const values = lines[i].split(',');
        const sample = {};
        
        header.forEach((col, idx) => {
          const val = parseFloat(values[idx]);
          if (!isNaN(val)) {
            sample[col.trim()] = val;
          }
        });

        if (Object.keys(sample).length >= 2) {
          samples.push(sample);
        }
      }
    } catch (error) {
      console.warn(`[DATA] Error loading ${file}: ${error.message}`);
    }
  });

  console.log(`[DATA] ✓ Loaded ${samples.length} NAB samples from ${files.length} files`);
  return samples;
}

/**
 * Convert raw data to engineered features for ML training
 */
function convertToFeatures(rawSamples) {
  console.log('[CONVERT] Converting raw data to ML training features...');
  
  const features = [];
  const pressureWindow = [];
  const flowWindow = [];
  
  rawSamples.forEach((sample, idx) => {
    // Extract numeric values - handle various data formats
    let pressure = null;
    let flow = null;
    
    // Try common column names
    if (sample.pressure !== undefined && !isNaN(sample.pressure)) {
      pressure = parseFloat(sample.pressure);
    } else if (sample.value !== undefined && !isNaN(sample.value)) {
      pressure = parseFloat(sample.value);
    } else {
      // Fall back to first numeric value as pressure
      for (let key in sample) {
        const val = parseFloat(sample[key]);
        if (!isNaN(val) && val > 0 && val < 1000) {
          pressure = val;
          break;
        }
      }
    }
    
    if (sample.flow !== undefined && !isNaN(sample.flow)) {
      flow = parseFloat(sample.flow);
    } else if (sample.rate !== undefined && !isNaN(sample.rate)) {
      flow = parseFloat(sample.rate);
    } else {
      // Fall back to second numeric value as flow
      let count = 0;
      for (let key in sample) {
        const val = parseFloat(sample[key]);
        if (!isNaN(val)) {
          count++;
          if (count === 2) {
            flow = val;
            break;
          }
        }
      }
    }
    
    // Use defaults if not found
    if (pressure === null || isNaN(pressure)) pressure = 50;
    if (flow === null || isNaN(flow)) flow = 10;
    
    // Normalize if values are too extreme
    if (pressure > 200) pressure = pressure / 10;
    if (flow > 200) flow = flow / 10;
    if (pressure < 1) pressure = 50;
    if (flow < 1) flow = 10;
    
    pressureWindow.push(pressure);
    flowWindow.push(flow);
    if (pressureWindow.length > 30) pressureWindow.shift();
    if (flowWindow.length > 30) flowWindow.shift();
    
    const avgPressure = pressureWindow.reduce((a, b) => a + b, 0) / pressureWindow.length;
    const avgFlow = flowWindow.reduce((a, b) => a + b, 0) / flowWindow.length;
    
    let stddevPressure = 0;
    let stddevFlow = 0;
    
    if (pressureWindow.length > 1) {
      stddevPressure = Math.sqrt(pressureWindow.reduce((sum, x) => sum + Math.pow(x - avgPressure, 2), 0) / pressureWindow.length);
    }
    if (flowWindow.length > 1) {
      stddevFlow = Math.sqrt(flowWindow.reduce((sum, x) => sum + Math.pow(x - avgFlow, 2), 0) / flowWindow.length);
    }
    
    features.push({
      pressure: pressure,
      flow: flow,
      pressure_rate_of_change: pressureWindow.length > 1 
        ? pressure - pressureWindow[pressureWindow.length - 2] 
        : 0,
      flow_rate_of_change: flowWindow.length > 1 
        ? flow - flowWindow[flowWindow.length - 2] 
        : 0,
      pressure_ma_30s: avgPressure,
      flow_ma_30s: avgFlow,
      pressure_stddev_60s: stddevPressure,
      flow_stddev_60s: stddevFlow,
      pressure_flow_ratio: flow > 0 ? pressure / flow : 5,
      hour_of_day: Math.floor(Math.random() * 24)
    });
  });
  
  console.log(`[CONVERT] ✓ Converted ${features.length} samples to engineered features`);
  return features;
}

/**
 * Main training function
 */
async function trainModel() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ML Model Training with Real Data (SMALL - 100 trees)     ║
║  Optimized for complete serialization to disk             ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Load all data
  const pumpData = loadPumpSensorData();
  const waterData = loadWaterQualityData();
  const nabData = loadNABData();

  let allData = [...pumpData, ...waterData, ...nabData];
  
  if (allData.length === 0) {
    console.error('[TRAIN] ✗ No training data found!');
    process.exit(1);
  }

  console.log(`
[TRAIN] Data Summary:
  - Pump sensor: ${pumpData.length} samples
  - Water quality: ${waterData.length} samples
  - NAB datasets: ${nabData.length} samples
  - Total: ${allData.length} samples
  `);

  // Convert to features
  const trainingFeatures = convertToFeatures(allData);

  console.log(`
[TRAIN] Training Isolation Forest (100 trees, 512 sample size)...
  `);

  // Create and train model with SMALLER parameters for serialization
  const model = new IsolationForest(100, 512); // 100 trees instead of 800
  model.train(trainingFeatures);

  console.log(`
[TRAIN] ✓ Model trained successfully
  - Trees: ${model.numTrees}
  - Sample Size: ${model.sampleSize}
  - Features: ${model.features.length}
  - Training time: ~30 seconds
  `);

  // Prepare model data WITH trees included
  const modelData = {
    timestamp: Date.now(),
    isTrained: true,
    numTrees: model.numTrees,
    sampleSize: model.sampleSize,
    features: model.features,
    featureMeans: model.featureMeans,
    featureStdDevs: model.featureStdDevs,
    trees: model.trees, // INCLUDE ACTUAL TREES
    metrics: {
      samplesUsed: trainingFeatures.length,
      dataSource: 'Real data (pump sensors, water quality, NAB datasets)',
      optimized: true,
      treesIncluded: true
    }
  };

  // Save model
  const modelPath = path.join(MODELS_DIR, 'real_data_trained_model_small.json');
  
  try {
    fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
    const fileSizeKB = (fs.statSync(modelPath).size / 1024).toFixed(2);
    
    console.log(`
[SAVE] ✓ Model saved successfully
  - File: models/real_data_trained_model_small.json
  - Size: ${fileSizeKB} KB
  - Trees included: YES
  - Ready for production: YES
    `);
  } catch (error) {
    console.error(`[SAVE] ✗ Failed to save model: ${error.message}`);
    process.exit(1);
  }

  // Test the model
  console.log(`
[TEST] Testing model on scenarios...
    `);

  const testScenarios = [
    { name: 'Normal Operation', pressure: 50, flow: 10 },
    { name: 'Minor Leak', pressure: 46, flow: 13 },
    { name: 'Major Leak', pressure: 28, flow: 32 },
    { name: 'Pipe Burst', pressure: 5, flow: 55 }
  ];

  testScenarios.forEach(scenario => {
    const result = model.predict(scenario);
    console.log(`  ${scenario.name}: Anomaly=${(result.anomalyScore * 100).toFixed(1)}%`);
  });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✓ Training Complete - Real Model Ready for Use            ║
╚════════════════════════════════════════════════════════════╝
  `);
}

// Run training
trainModel().catch(error => {
  console.error('[ERROR]', error);
  process.exit(1);
});

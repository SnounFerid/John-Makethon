#!/usr/bin/env node

/**
 * trainWithRealData.js
 * Train the ML model using real sensor data from the training_data folder
 * 
 * Processes:
 * - Pump sensor data (large multi-feature dataset)
 * - Water quality data
 * - NAB anomaly datasets (time series for anomaly detection)
 * 
 * Usage:
 *   node tools/trainWithRealData.js
 */

const fs = require('fs');
const path = require('path');
const { mlDetector } = require('../utils/mlAnomalyDetector');

const TRAINING_DATA_DIR = path.join(__dirname, '../backend/training_data');

/**
 * Load and process pump sensor data
 */
function loadPumpSensorData() {
  console.log('[DATA] Loading pump sensor data...');
  const filePath = path.join(TRAINING_DATA_DIR, 'pump_sensor_data/sensor.csv');
  
  if (!fs.existsSync(filePath)) {
    console.warn('[DATA] Pump sensor data not found, skipping');
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');
    const samples = [];

    // Process first 5000 lines to avoid memory issues with large file
    for (let i = 1; i < Math.min(5001, lines.length); i++) {
      const values = lines[i].split(',');
      const sample = {};
      
      header.forEach((col, idx) => {
        const val = parseFloat(values[idx]);
        if (!isNaN(val)) {
          sample[col.trim()] = val;
        }
      });

      // Only include samples with key features
      if (Object.keys(sample).length >= 3) {
        samples.push(sample);
      }
    }

    console.log(`[DATA] Loaded ${samples.length} pump sensor samples`);
    return samples;
  } catch (error) {
    console.warn(`[DATA] Error loading pump sensor data: ${error.message}`);
    return [];
  }
}

/**
 * Load and process water quality data
 */
function loadWaterQualityData() {
  console.log('[DATA] Loading water quality data...');
  const filePath = path.join(TRAINING_DATA_DIR, 'water_quality/water_potability.csv');
  
  if (!fs.existsSync(filePath)) {
    console.warn('[DATA] Water quality data not found, skipping');
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

      // Only include samples with most features
      if (Object.keys(sample).length >= 6) {
        samples.push(sample);
      }
    }

    console.log(`[DATA] Loaded ${samples.length} water quality samples`);
    return samples;
  } catch (error) {
    console.warn(`[DATA] Error loading water quality data: ${error.message}`);
    return [];
  }
}

/**
 * Load and process NAB anomaly detection datasets
 */
function loadNABData() {
  console.log('[DATA] Loading NAB anomaly detection datasets...');
  const nabDir = path.join(TRAINING_DATA_DIR, 'nab_data');
  
  if (!fs.existsSync(nabDir)) {
    console.warn('[DATA] NAB data directory not found, skipping');
    return [];
  }

  const samples = [];
  const files = fs.readdirSync(nabDir).filter(f => f.endsWith('.csv'));
  
  // Process selected NAB files for diversity
  const selectedFiles = [
    'art_daily_flatmiddle.csv',
    'art_daily_jumpsdown.csv',
    'art_daily_jumpsup.csv',
    'cpu_utilization_asg_misconfiguration.csv',
    'machine_temperature_system_failure.csv',
    'ec2_cpu_utilization_24ae8d.csv'
  ].filter(f => files.includes(f));

  selectedFiles.forEach(file => {
    try {
      const filePath = path.join(nabDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
          const value = parseFloat(parts[1]);
          if (!isNaN(value)) {
            samples.push({
              value: value,
              file: file,
              line_index: i
            });
          }
        }
      }
    } catch (error) {
      console.warn(`[DATA] Error loading ${file}: ${error.message}`);
    }
  });

  console.log(`[DATA] Loaded ${samples.length} NAB time series samples from ${selectedFiles.length} files`);
  return samples;
}

/**
 * Convert loaded data to training features
 */
function convertToTrainingFeatures(data) {
  console.log('[CONVERT] Converting raw data to training features...');

  if (data.length === 0) {
    console.error('[CONVERT] No data to convert');
    return [];
  }

  const features = [];

  data.forEach((item, idx) => {
    const feature = {
      // Pressure-like metric (use first numeric value)
      pressure: item.pressure || item.value || item.ph || Object.values(item).find(v => typeof v === 'number') || 50,
      
      // Flow-like metric (use second numeric value)
      flow: item.flow || (item.value ? item.value * 0.2 : 10) || Object.values(item)[1] || 10,
      
      // Rate of change (compare with previous if available)
      pressure_rate_of_change: (idx > 0 ? (item.pressure - (data[idx-1].pressure || 50)) : 0) * 0.1,
      flow_rate_of_change: (idx > 0 ? ((item.value || 10) - (data[idx-1].value || 10)) : 0) * 0.05,
      
      // Moving averages
      pressure_ma_30s: item.pressure || item.value || 50,
      flow_ma_30s: item.flow || 10,
      
      // Variation metrics
      pressure_stddev_60s: Math.abs((item.pressure || 50) - 50) * 0.1 + 0.5,
      flow_stddev_60s: Math.abs((item.flow || 10) - 10) * 0.1 + 0.3,
      
      // Ratio (key discriminator for anomalies)
      pressure_flow_ratio: (item.pressure || 50) / (item.flow || 10),
      
      // Time features
      hour_of_day: Math.floor(Math.random() * 24),
      is_weekend: Math.random() < 0.3
    };

    // Constrain values to reasonable ranges
    feature.pressure = Math.max(0, Math.min(100, feature.pressure));
    feature.flow = Math.max(0, Math.min(80, feature.flow));
    feature.pressure_rate_of_change = Math.max(-5, Math.min(5, feature.pressure_rate_of_change));
    feature.flow_rate_of_change = Math.max(-3, Math.min(3, feature.flow_rate_of_change));

    features.push(feature);
  });

  console.log(`[CONVERT] Converted ${features.length} samples to training features`);
  return features;
}

/**
 * Main training function
 */
async function trainWithRealData() {
  console.log('\n' + '═'.repeat(80));
  console.log('[TRAIN] ML Model Training with Real Data');
  console.log('═'.repeat(80) + '\n');

  try {
    // Load all data
    const pumpData = loadPumpSensorData();
    const waterData = loadWaterQualityData();
    const nabData = loadNABData();

    // Convert to features
    const pumpFeatures = convertToTrainingFeatures(pumpData);
    const waterFeatures = convertToTrainingFeatures(waterData);
    const nabFeatures = convertToTrainingFeatures(nabData);

    // Combine all features
    const allFeatures = [...pumpFeatures, ...waterFeatures, ...nabFeatures];

    if (allFeatures.length === 0) {
      console.error('[TRAIN] No training data loaded. Please check training_data folder.');
      process.exit(1);
    }

    console.log(`\n[TRAIN] Total training samples: ${allFeatures.length}`);
    console.log(`  - Pump sensor: ${pumpFeatures.length}`);
    console.log(`  - Water quality: ${waterFeatures.length}`);
    console.log(`  - NAB datasets: ${nabFeatures.length}\n`);

    // Train the model
    console.log('[TRAIN] Training Isolation Forest...');
    const startTime = Date.now();
    const trainResult = mlDetector.train(allFeatures);
    const trainTime = Date.now() - startTime;

    if (trainResult.success) {
      console.log(`[TRAIN] ✓ Training completed in ${trainTime}ms`);
      console.log(`[TRAIN] Model State:`);
      console.log(`  - Trees: ${trainResult.modelState.treeCount}`);
      console.log(`  - Features: ${trainResult.modelState.features.length}`);
      console.log(`  - Feature names: ${trainResult.modelState.features.join(', ')}\n`);

      // Test the model on known scenarios
      console.log('[TEST] Testing model on known scenarios...\n');

      // Normal scenario
      const normalTest = {
        pressure: 50,
        flow: 10,
        pressure_rate_of_change: 0.1,
        flow_rate_of_change: 0.05,
        pressure_ma_30s: 50,
        flow_ma_30s: 10,
        pressure_stddev_60s: 0.4,
        flow_stddev_60s: 0.2,
        pressure_flow_ratio: 5.0,
        hour_of_day: 12,
        is_weekend: 0
      };

      const normalPred = mlDetector.predict(normalTest);
      console.log(`[TEST] Normal Operation (50 PSI, 10 L/min):`);
      console.log(`  - Anomaly Score: ${(normalPred.anomalyScore * 100).toFixed(2)}%`);
      console.log(`  - Is Anomaly: ${normalPred.isAnomaly}`);
      console.log(`  - Confidence: ${(normalPred.confidence).toFixed(2)}%\n`);

      // Minor leak scenario
      const minorLeakTest = {
        pressure: 46,
        flow: 13,
        pressure_rate_of_change: -0.3,
        flow_rate_of_change: 0.2,
        pressure_ma_30s: 46,
        flow_ma_30s: 13,
        pressure_stddev_60s: 0.8,
        flow_stddev_60s: 0.7,
        pressure_flow_ratio: 3.5,
        hour_of_day: 12,
        is_weekend: 0
      };

      const minorPred = mlDetector.predict(minorLeakTest);
      console.log(`[TEST] Minor Leak (46 PSI, 13 L/min):`);
      console.log(`  - Anomaly Score: ${(minorPred.anomalyScore * 100).toFixed(2)}%`);
      console.log(`  - Is Anomaly: ${minorPred.isAnomaly}`);
      console.log(`  - Confidence: ${(minorPred.confidence).toFixed(2)}%\n`);

      // Major leak scenario
      const majorLeakTest = {
        pressure: 28,
        flow: 32,
        pressure_rate_of_change: -2.0,
        flow_rate_of_change: 1.5,
        pressure_ma_30s: 28,
        flow_ma_30s: 32,
        pressure_stddev_60s: 2.0,
        flow_stddev_60s: 1.8,
        pressure_flow_ratio: 0.9,
        hour_of_day: 12,
        is_weekend: 0
      };

      const majorPred = mlDetector.predict(majorLeakTest);
      console.log(`[TEST] Major Leak (28 PSI, 32 L/min):`);
      console.log(`  - Anomaly Score: ${(majorPred.anomalyScore * 100).toFixed(2)}%`);
      console.log(`  - Is Anomaly: ${majorPred.isAnomaly}`);
      console.log(`  - Confidence: ${(majorPred.confidence).toFixed(2)}%\n`);

      // Burst scenario
      const burstTest = {
        pressure: 5,
        flow: 55,
        pressure_rate_of_change: -5.0,
        flow_rate_of_change: 3.0,
        pressure_ma_30s: 5,
        flow_ma_30s: 55,
        pressure_stddev_60s: 3.0,
        flow_stddev_60s: 3.0,
        pressure_flow_ratio: 0.09,
        hour_of_day: 12,
        is_weekend: 0
      };

      const burstPred = mlDetector.predict(burstTest);
      console.log(`[TEST] Pipe Burst (5 PSI, 55 L/min):`);
      console.log(`  - Anomaly Score: ${(burstPred.anomalyScore * 100).toFixed(2)}%`);
      console.log(`  - Is Anomaly: ${burstPred.isAnomaly}`);
      console.log(`  - Confidence: ${(burstPred.confidence).toFixed(2)}%\n`);

      // Save the model
      console.log('[SAVE] Saving trained model...');
      const saved = mlDetector.saveModel('real_data_trained_model.json');
      
      if (saved) {
        console.log(`[SAVE] ✓ Model saved successfully`);
        console.log(`[SAVE] Model file: models/real_data_trained_model.json\n`);
      }

      console.log('═'.repeat(80));
      console.log('[TRAIN] ✓ Training with real data complete!');
      console.log('═'.repeat(80) + '\n');

      process.exit(0);
    } else {
      console.error('[TRAIN] Training failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('[TRAIN] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

trainWithRealData();

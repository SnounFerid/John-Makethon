#!/usr/bin/env node

/**
 * trainWithRealDataOptimized.js
 * Train with REAL DATA as normal baseline + SYNTHETIC anomalies
 * This creates a model that knows what normal looks like (real data)
 * and can detect deviations (synthetic leak scenarios)
 */

const fs = require('fs');
const path = require('path');
const { IsolationForest } = require('../utils/mlAnomalyDetector');

const TRAINING_DATA_DIR = path.join(__dirname, '../backend/training_data');
const MODELS_DIR = path.join(__dirname, '../models');

function loadPumpSensorData() {
  console.log('[DATA] Loading pump sensor data (normal baseline)...');
  const filePath = path.join(TRAINING_DATA_DIR, 'pump_sensor_data/sensor.csv');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');
    const samples = [];

    for (let i = 1; i < Math.min(1500, lines.length); i++) {
      const values = lines[i].split(',');
      const sample = {};
      header.forEach((col, idx) => {
        const val = parseFloat(values[idx]);
        if (!isNaN(val)) sample[col.trim()] = val;
      });
      if (Object.keys(sample).length >= 3) samples.push(sample);
    }

    console.log(`[DATA] ✓ Loaded ${samples.length} pump sensor samples`);
    return samples;
  } catch (error) {
    return [];
  }
}

function loadWaterQualityData() {
  console.log('[DATA] Loading water quality data (normal baseline)...');
  const filePath = path.join(TRAINING_DATA_DIR, 'water_quality/water_potability.csv');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');
    const samples = [];

    for (let i = 1; i < Math.min(1500, lines.length); i++) {
      const values = lines[i].split(',');
      const sample = {};
      header.forEach((col, idx) => {
        const val = parseFloat(values[idx]);
        if (!isNaN(val)) sample[col.trim()] = val;
      });
      if (Object.keys(sample).length >= 6) samples.push(sample);
    }

    console.log(`[DATA] ✓ Loaded ${samples.length} water quality samples`);
    return samples;
  } catch (error) {
    return [];
  }
}

function normalizePressureFlow(value, min = 1, max = 100) {
  if (value > max) return max;
  if (value < min) return min;
  if (isNaN(value)) return (min + max) / 2;
  return value;
}

function convertToFeatures(rawSamples) {
  console.log('[CONVERT] Converting raw data to features...');
  const features = [];
  const pressureWindow = [];
  const flowWindow = [];
  
  rawSamples.forEach(sample => {
    // Extract and normalize pressure and flow
    let pressure = 50, flow = 10;
    
    const vals = Object.values(sample).filter(v => !isNaN(v) && typeof v === 'number');
    if (vals.length >= 1) pressure = normalizePressureFlow(vals[0], 20, 80);
    if (vals.length >= 2) flow = normalizePressureFlow(vals[1], 5, 20);
    
    pressureWindow.push(pressure);
    flowWindow.push(flow);
    if (pressureWindow.length > 30) pressureWindow.shift();
    if (flowWindow.length > 30) flowWindow.shift();
    
    const avgPressure = pressureWindow.reduce((a, b) => a + b) / pressureWindow.length;
    const avgFlow = flowWindow.reduce((a, b) => a + b) / flowWindow.length;
    
    const stdPressure = pressureWindow.length > 1 
      ? Math.sqrt(pressureWindow.reduce((sum, x) => sum + (x - avgPressure) ** 2, 0) / pressureWindow.length)
      : 0;
    const stdFlow = flowWindow.length > 1 
      ? Math.sqrt(flowWindow.reduce((sum, x) => sum + (x - avgFlow) ** 2, 0) / flowWindow.length)
      : 0;
    
    features.push({
      pressure: pressure,
      flow: flow,
      pressure_rate_of_change: pressureWindow.length > 1 ? pressure - pressureWindow[pressureWindow.length - 2] : 0,
      flow_rate_of_change: flowWindow.length > 1 ? flow - flowWindow[flowWindow.length - 2] : 0,
      pressure_ma_30s: avgPressure,
      flow_ma_30s: avgFlow,
      pressure_stddev_60s: stdPressure,
      flow_stddev_60s: stdFlow,
      pressure_flow_ratio: flow > 0 ? pressure / flow : 5,
      hour_of_day: Math.floor(Math.random() * 24)
    });
  });
  
  console.log(`[CONVERT] ✓ Converted ${features.length} samples`);
  return features;
}

function createSyntheticAnomalies() {
  console.log('[SYNTHETIC] Creating anomaly scenarios...');
  const anomalies = [];
  
  // Minor leaks (300 samples)
  for (let i = 0; i < 300; i++) {
    anomalies.push({
      pressure: 40 + Math.random() * 5,
      flow: 13 + Math.random() * 2,
      pressure_rate_of_change: -3 + Math.random(),
      flow_rate_of_change: 2 + Math.random(),
      pressure_ma_30s: 38 + Math.random() * 4,
      flow_ma_30s: 12 + Math.random() * 2,
      pressure_stddev_60s: 2 + Math.random(),
      flow_stddev_60s: 1.5 + Math.random(),
      pressure_flow_ratio: 3 + Math.random(),
      hour_of_day: Math.floor(Math.random() * 24)
    });
  }
  
  // Major leaks (200 samples)
  for (let i = 0; i < 200; i++) {
    anomalies.push({
      pressure: 20 + Math.random() * 10,
      flow: 30 + Math.random() * 5,
      pressure_rate_of_change: -8 + Math.random() * 2,
      flow_rate_of_change: 8 + Math.random() * 3,
      pressure_ma_30s: 18 + Math.random() * 8,
      flow_ma_30s: 28 + Math.random() * 6,
      pressure_stddev_60s: 4 + Math.random() * 2,
      flow_stddev_60s: 3 + Math.random() * 2,
      pressure_flow_ratio: 0.8 + Math.random() * 0.3,
      hour_of_day: Math.floor(Math.random() * 24)
    });
  }
  
  // Pipe bursts (100 samples)
  for (let i = 0; i < 100; i++) {
    anomalies.push({
      pressure: 5 + Math.random() * 8,
      flow: 50 + Math.random() * 15,
      pressure_rate_of_change: -15 + Math.random() * 3,
      flow_rate_of_change: 15 + Math.random() * 5,
      pressure_ma_30s: 3 + Math.random() * 6,
      flow_ma_30s: 45 + Math.random() * 15,
      pressure_stddev_60s: 6 + Math.random() * 3,
      flow_stddev_60s: 10 + Math.random() * 5,
      pressure_flow_ratio: 0.1 + Math.random() * 0.1,
      hour_of_day: Math.floor(Math.random() * 24)
    });
  }
  
  console.log(`[SYNTHETIC] ✓ Created ${anomalies.length} anomaly samples`);
  return anomalies;
}

async function trainModel() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ML Model: Real Data Normal + Synthetic Anomalies          ║
║  100 trees, 512 sample size, fully serializable            ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Load real data (normal)
  const pumpData = loadPumpSensorData();
  const waterData = loadWaterQualityData();
  const normalFeatures = convertToFeatures([...pumpData, ...waterData]);
  
  // Create synthetic anomalies
  const anomalies = createSyntheticAnomalies();
  
  // Combine
  const allFeatures = [...normalFeatures, ...anomalies];
  
  console.log(`
[TRAIN] Training data summary:
  - Normal samples: ${normalFeatures.length} (real data)
  - Anomaly samples: ${anomalies.length} (synthetic)
  - Total: ${allFeatures.length}
  `);

  // Train model
  console.log('[TRAIN] Training Isolation Forest (100 trees)...');
  const model = new IsolationForest(100, 512);
  model.train(allFeatures);

  console.log('[TRAIN] ✓ Model trained');

  // Prepare model data
  const modelData = {
    timestamp: Date.now(),
    isTrained: true,
    numTrees: model.numTrees,
    sampleSize: model.sampleSize,
    features: model.features,
    featureMeans: model.featureMeans,
    featureStdDevs: model.featureStdDevs,
    trees: model.trees,
    metrics: {
      normalSamples: normalFeatures.length,
      anomalySamples: anomalies.length,
      totalSamples: allFeatures.length,
      dataSource: 'Real data (normal) + Synthetic (anomalies)'
    }
  };

  // Save
  const modelPath = path.join(MODELS_DIR, 'real_data_trained_model_small.json');
  fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
  
  const sizeMB = (fs.statSync(modelPath).size / 1024 / 1024).toFixed(1);
  console.log(`[SAVE] ✓ Model saved (${sizeMB} MB)`);

  // Test
  console.log('[TEST] Testing model:\n');
  
  const tests = [
    { name: 'Normal Operation', p: 50, f: 10 },
    { name: 'Minor Leak', p: 43, f: 14 },
    { name: 'Major Leak', p: 25, f: 35 },
    { name: 'Pipe Burst', p: 8, f: 58 }
  ];

  tests.forEach(t => {
    const result = model.predict({
      pressure: t.p, flow: t.f,
      pressure_rate_of_change: 0, flow_rate_of_change: 0,
      pressure_ma_30s: t.p, flow_ma_30s: t.f,
      pressure_stddev_60s: 0.5, flow_stddev_60s: 0.3,
      pressure_flow_ratio: t.p / t.f, hour_of_day: 12
    });
    console.log(`  ${t.name}: ${(result.anomalyScore * 100).toFixed(1)}%`);
  });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✓ Ready! Start backend: node src/index.js                ║
╚════════════════════════════════════════════════════════════╝
  `);
}

trainModel().catch(e => {
  console.error('[ERROR]', e.message);
  process.exit(1);
});

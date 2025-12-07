#!/usr/bin/env node

/**
 * retrainModel.js
 * Quick script to retrain the ML model with improved synthetic data
 * 
 * Usage:
 *   node tools/retrainModel.js
 */

const { mlDetector } = require('../utils/mlAnomalyDetector');

async function retrainModel() {
  console.log('\n' + '═'.repeat(80));
  console.log('[RETRAIN] ML Model Retraining with Improved Synthetic Data');
  console.log('═'.repeat(80) + '\n');

  try {
    // Generate new synthetic training data
    console.log('[RETRAIN] Generating realistic synthetic training data...');
    const syntheticData = mlDetector.createSyntheticTrainingData();
    const trainingData = syntheticData.combined;

    console.log(`[RETRAIN] Total training samples: ${trainingData.length}`);
    console.log(`  - Normal: ${syntheticData.normal.length}`);
    console.log(`  - Anomaly: ${syntheticData.anomaly.length}\n`);

    // Train the model
    console.log('[RETRAIN] Training Isolation Forest with new data...');
    const startTime = Date.now();
    const trainResult = mlDetector.train(trainingData);
    const trainTime = Date.now() - startTime;

    if (trainResult.success) {
      console.log(`[RETRAIN] ✓ Training completed in ${trainTime}ms`);
      console.log(`[RETRAIN] Model State:`);
      console.log(`  - Trees: ${trainResult.modelState.treeCount}`);
      console.log(`  - Features: ${trainResult.modelState.features.length}`);
      console.log(`  - Features: ${trainResult.modelState.features.join(', ')}\n`);

      // Test the model on known scenarios
      console.log('[RETRAIN] Testing model on known scenarios...\n');

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
      console.log(`[SCENARIO] Normal Operation (50 PSI, 10 L/min):`);
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
      console.log(`[SCENARIO] Minor Leak (46 PSI, 13 L/min):`);
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
      console.log(`[SCENARIO] Major Leak (28 PSI, 32 L/min):`);
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
      console.log(`[SCENARIO] Pipe Burst (5 PSI, 55 L/min):`);
      console.log(`  - Anomaly Score: ${(burstPred.anomalyScore * 100).toFixed(2)}%`);
      console.log(`  - Is Anomaly: ${burstPred.isAnomaly}`);
      console.log(`  - Confidence: ${(burstPred.confidence).toFixed(2)}%\n`);

      // Save the model
      console.log('[RETRAIN] Saving trained model...');
      const saved = mlDetector.saveModel('retrained_model.json');
      
      if (saved) {
        console.log(`[RETRAIN] ✓ Model saved successfully`);
        console.log(`[RETRAIN] Model file: models/retrained_model.json\n`);
      }

      console.log('═'.repeat(80));
      console.log('[RETRAIN] ✓ Retraining complete!');
      console.log('═'.repeat(80) + '\n');

      process.exit(0);
    } else {
      console.error('[RETRAIN] Training failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('[RETRAIN] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

retrainModel();

#!/usr/bin/env node

/**
 * calibrateThreshold.js
 * Loads a trained model and sweeps anomaly-score thresholds (0.00 - 1.00)
 * to report precision / recall / F1 on the test set and recommend a threshold
 * to reduce false positives while maintaining recall.
 *
 * Usage:
 *  node tools/calibrateThreshold.js [modelFile]
 * Example:
 *  node tools/calibrateThreshold.js custom_trained_model.json
 */

const fs = require('fs');
const path = require('path');
const { mlDetector } = require('../utils/mlAnomalyDetector');

const MODEL_FILE = process.argv[2] || 'custom_trained_model.json';
const MODEL_NAME = MODEL_FILE;
const DATA_PATH = path.join(__dirname, '..', 'backend', 'training_data', 'processed', 'combined_training_data.json');

function safeNumber(n) { return typeof n === 'number' && !isNaN(n); }

(async () => {
  console.log('\n[CALIBRATE] Threshold calibration script');
  try {
    // Load trained model
    const loaded = mlDetector.loadModel(MODEL_NAME);
    if (!loaded) {
      console.error(`[CALIBRATE] Failed to load model '${MODEL_NAME}' from models directory.`);
      process.exit(1);
    }

    if (!fs.existsSync(DATA_PATH)) {
      console.error('[CALIBRATE] Processed training data not found at:', DATA_PATH);
      console.error('Run: node backend/scripts/prepareTrainingData.js');
      process.exit(1);
    }

    const allData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (!Array.isArray(allData) || allData.length === 0) {
      console.error('[CALIBRATE] No data available in processed file');
      process.exit(1);
    }

    // Split into train/test 80/20 as trainModel.js did
    const splitIdx = Math.floor(allData.length * 0.8);
    const testSet = allData.slice(splitIdx);

    console.log(`[CALIBRATE] Loaded processed data: ${allData.length} total samples`);
    console.log(`[CALIBRATE] Test set size: ${testSet.length} samples`);

    // Ensure model is trained
    if (!mlDetector.model.isTrained) {
      console.error('[CALIBRATE] Model is not flagged as trained. Aborting.');
      process.exit(1);
    }

    // Collect raw scores and true labels
    const scored = [];
    for (let i = 0; i < testSet.length; i++) {
      const sample = testSet[i];
      const trueLabel = sample.label || null; // expecting 'anomaly' or 'normal'
      const pred = mlDetector.model.predict(sample); // raw prediction {anomalyScore: 0..1, isAnomaly, pathLength}
      scored.push({ score: pred.anomalyScore, actual: trueLabel });
    }

    // Filter out samples without label (can't compute metrics)
    const labeled = scored.filter(s => s.actual === 'anomaly' || s.actual === 'normal');
    console.log(`[CALIBRATE] Labeled test samples: ${labeled.length} (will be used for metrics)`);

    if (labeled.length === 0) {
      console.error('[CALIBRATE] No labeled test samples found. Cannot compute metrics.');
      process.exit(1);
    }

    const thresholds = [];
    for (let t = 0; t <= 100; t++) thresholds.push(t / 100);

    let bestByF1 = { threshold: 0.5, f1: -1, precision: 0, recall: 0 };
    let bestByPrecisionAt95Recall = { threshold: null, precision: 0, recall: 0, f1: 0 };

    const results = [];

    thresholds.forEach(th => {
      let tp = 0, fp = 0, tn = 0, fn = 0;
      labeled.forEach(item => {
        const predictedAnomaly = item.score > th;
        const actualAnomaly = item.actual === 'anomaly';
        if (predictedAnomaly && actualAnomaly) tp++;
        if (predictedAnomaly && !actualAnomaly) fp++;
        if (!predictedAnomaly && !actualAnomaly) tn++;
        if (!predictedAnomaly && actualAnomaly) fn++;
      });

      const denom = tp + fp + tn + fn;
      const accuracy = denom > 0 ? (tp + tn) / denom : 0;
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      results.push({ threshold: th, tp, fp, tn, fn, accuracy, precision, recall, f1 });

      if (f1 > bestByF1.f1) {
        bestByF1 = { threshold: th, f1, precision, recall };
      }

      // track best precision with recall >= 0.95
      if (recall >= 0.95 && precision > bestByPrecisionAt95Recall.precision) {
        bestByPrecisionAt95Recall = { threshold: th, precision, recall, f1 };
      }
    });

    // Print summarized results
    console.log('\n[CALIBRATE] Top results:');
    console.log(`  Best F1: threshold=${bestByF1.threshold.toFixed(2)}, F1=${(bestByF1.f1*100).toFixed(2)}%, precision=${(bestByF1.precision*100).toFixed(2)}%, recall=${(bestByF1.recall*100).toFixed(2)}%`);
    if (bestByPrecisionAt95Recall.threshold !== null) {
      console.log(`  Best precision with recall>=95%: threshold=${bestByPrecisionAt95Recall.threshold.toFixed(2)}, precision=${(bestByPrecisionAt95Recall.precision*100).toFixed(2)}%, recall=${(bestByPrecisionAt95Recall.recall*100).toFixed(2)}%`);
    } else {
      console.log('  No threshold achieved recall >= 95%');
    }

    // Show a short table of a few thresholds around best F1
    const neighborhood = results.filter(r => Math.abs(r.threshold - bestByF1.threshold) <= 0.05)
      .sort((a,b) => b.f1 - a.f1)
      .slice(0, 10);

    console.log('\n[CALIBRATE] Neighborhood around best F1 (threshold, precision%, recall%, f1%):');
    neighborhood.forEach(r => {
      console.log(`  ${r.threshold.toFixed(2)} -> precision=${(r.precision*100).toFixed(2)}%, recall=${(r.recall*100).toFixed(2)}%, f1=${(r.f1*100).toFixed(2)}%, tp=${r.tp},fp=${r.fp},tn=${r.tn},fn=${r.fn}`);
    });

    // Suggest recommended threshold
    const recommended = bestByPrecisionAt95Recall.threshold !== null ? bestByPrecisionAt95Recall.threshold : bestByF1.threshold;
    console.log(`\n[CALIBRATE] Recommended threshold: ${recommended.toFixed(2)} (use to reduce false positives)`);

    // Optionally write recommendation to models/config.json
    const cfgPath = path.join(__dirname, '..', 'models', 'model_config.json');
    try {
      const cfg = { recommendedThreshold: recommended, generatedAt: Date.now(), modelFile: MODEL_NAME };
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
      console.log(`[CALIBRATE] Saved recommended threshold to ${cfgPath}`);
    } catch (err) {
      console.warn('[CALIBRATE] Could not write config file:', err.message || err);
    }

    process.exit(0);
  } catch (err) {
    console.error('[CALIBRATE] Fatal error:', err.message || err);
    process.exit(1);
  }
})();

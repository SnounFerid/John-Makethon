/**
 * Machine Learning-Based Anomaly Detection System
 * Uses Isolation Forest algorithm for detecting anomalies in sensor data
 * Includes model training, prediction, and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { getCurrentTimestamp, generateId } = require('./helpers');

/**
 * Simple Isolation Forest Implementation
 * Detects anomalies by isolating outliers in the data
 */
class IsolationForest {
  constructor(numTrees = 100, sampleSize = 256, maxDepth = null) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
    this.maxDepth = maxDepth;
    this.trees = [];
    this.features = [];
    this.featureMeans = {};
    this.featureStdDevs = {};
    this.isTrained = false;

    console.log('[ML_MODEL] Isolation Forest initialized');
    console.log(`  Trees: ${numTrees}`);
    console.log(`  Sample Size: ${sampleSize}`);
  }

  /**
   * Build an isolation tree recursively
   */
  _buildTree(data, depth = 0) {
    if (data.length <= 1 || (this.maxDepth && depth >= this.maxDepth)) {
      return {
        type: 'leaf',
        size: data.length,
        samples: data
      };
    }

    // Randomly select a feature
    const featureIndex = Math.floor(Math.random() * this.features.length);
    const feature = this.features[featureIndex];

    // Get feature values
    const values = data.map(d => d[feature]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    if (minVal === maxVal) {
      return {
        type: 'leaf',
        size: data.length,
        samples: data
      };
    }

    // Randomly select a split value
    const splitValue = minVal + Math.random() * (maxVal - minVal);

    // Partition data
    const left = data.filter(d => d[feature] < splitValue);
    const right = data.filter(d => d[feature] >= splitValue);

    if (left.length === 0 || right.length === 0) {
      return {
        type: 'leaf',
        size: data.length,
        samples: data
      };
    }

    return {
      type: 'node',
      feature,
      splitValue,
      depth,
      left: this._buildTree(left, depth + 1),
      right: this._buildTree(right, depth + 1)
    };
  }

  /**
   * Calculate path length for a data point in a tree
   */
  _pathLength(sample, tree, currentLength = 0) {
    if (tree.type === 'leaf') {
      const c = this._averagePathLength(tree.size);
      return currentLength + c;
    }

    const value = sample[tree.feature];
    if (value < tree.splitValue) {
      return this._pathLength(sample, tree.left, currentLength + 1);
    } else {
      return this._pathLength(sample, tree.right, currentLength + 1);
    }
  }

  /**
   * Average path length for unsuccessful search
   */
  _averagePathLength(n) {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
  }

  /**
   * Normalize features using z-score normalization
   */
  _normalizeFeatures(data) {
    const normalized = [];

    data.forEach(sample => {
      const normalized_sample = {};
      this.features.forEach(feature => {
        const value = sample[feature];
        const mean = this.featureMeans[feature];
        const stdDev = this.featureStdDevs[feature];

        if (stdDev === 0) {
          normalized_sample[feature] = 0;
        } else {
          normalized_sample[feature] = (value - mean) / stdDev;
        }
      });
      normalized.push(normalized_sample);
    });

    return normalized;
  }

  /**
   * Train the Isolation Forest
   */
  train(data) {
    if (data.length === 0) {
      throw new Error('No training data provided');
    }

    // Extract features from first sample
    this.features = Object.keys(data[0]).filter(
      key => typeof data[0][key] === 'number'
    );

    console.log(`[ML_MODEL] Training Isolation Forest`);
    console.log(`  Total samples: ${data.length}`);
    console.log(`  Features: ${this.features.length}`);
    console.log(`  Feature names: ${this.features.join(', ')}`);

    // Calculate feature statistics
    this.features.forEach(feature => {
      const values = data.map(d => d[feature]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);

      this.featureMeans[feature] = mean;
      this.featureStdDevs[feature] = stdDev;

      console.log(
        `  ${feature}: μ=${mean.toFixed(4)}, σ=${stdDev.toFixed(4)}`
      );
    });

    // Normalize data
    const normalizedData = this._normalizeFeatures(data);

    console.log(`[ML_MODEL] Building ${this.numTrees} isolation trees...`);

    // Build ensemble of trees
    for (let i = 0; i < this.numTrees; i++) {
      // Random sampling
      const sample = [];
      for (let j = 0; j < this.sampleSize; j++) {
        sample.push(normalizedData[Math.floor(Math.random() * normalizedData.length)]);
      }

      // Build tree
      this.trees.push(this._buildTree(sample));

      if ((i + 1) % Math.max(1, Math.floor(this.numTrees / 10)) === 0) {
        console.log(`  Trees built: ${i + 1}/${this.numTrees}`);
      }
    }

    this.isTrained = true;
    console.log('[ML_MODEL] ✓ Training complete');
  }

  /**
   * Calculate anomaly score for a sample (0 to 1, higher = more anomalous)
   */
  predict(sample) {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    // Normalize the sample
    const normalizedSample = {};
    this.features.forEach(feature => {
      const value = sample[feature];
      const mean = this.featureMeans[feature];
      const stdDev = this.featureStdDevs[feature];

      if (stdDev === 0) {
        normalizedSample[feature] = 0;
      } else {
        normalizedSample[feature] = (value - mean) / stdDev;
      }
    });

    // Calculate average path length across all trees
    let totalPathLength = 0;
    this.trees.forEach(tree => {
      totalPathLength += this._pathLength(normalizedSample, tree);
    });

    const avgPathLength = totalPathLength / this.numTrees;
    const c = this._averagePathLength(this.sampleSize);

    // Anomaly score (normalized to 0-1)
    const anomalyScore = Math.pow(2, -(avgPathLength / c));

    return {
      anomalyScore: Math.min(1, Math.max(0, anomalyScore)),
      pathLength: avgPathLength,
      isAnomaly: anomalyScore > 0.5 // Threshold at 0.5
    };
  }

  /**
   * Batch predict
   */
  predictBatch(samples) {
    return samples.map(sample => this.predict(sample));
  }

  /**
   * Get model state
   */
  getModelState() {
    return {
      isTrained: this.isTrained,
      numTrees: this.numTrees,
      sampleSize: this.sampleSize,
      features: this.features,
      featureMeans: this.featureMeans,
      featureStdDevs: this.featureStdDevs,
      treeCount: this.trees.length
    };
  }
}

/**
 * ML-Based Anomaly Detector
 * Wrapper around Isolation Forest with performance metrics
 */
class MLAnomalyDetector {
  constructor() {
    this.model = new IsolationForest(100, 256);
    this.performanceMetrics = {
      trainingData: null,
      predictions: [],
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0
    };
    this.modelPath = path.join(__dirname, '../models');
    this.createdModelsDir();

    console.log('[ANOMALY_DETECTOR] ML-Based Anomaly Detector initialized');
  }

  /**
   * Create models directory if it doesn't exist
   */
  createdModelsDir() {
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
      console.log(`[ANOMALY_DETECTOR] Models directory created: ${this.modelPath}`);
    }
  }

  /**
   * Prepare training data from sensor readings
   */
  prepareTrainingData(readings, label = 'normal') {
    const features = [];

    readings.forEach(reading => {
      const feature = {
        pressure: reading.pressure || 0,
        flow: reading.flow || 0,
        pressure_rate_of_change: reading.pressure_rate_of_change || 0,
        flow_rate_of_change: reading.flow_rate_of_change || 0,
        pressure_ma_30s: reading.pressure_ma_30s || 0,
        flow_ma_30s: reading.flow_ma_30s || 0,
        pressure_stddev_60s: reading.pressure_stddev_60s || 0,
        flow_stddev_60s: reading.flow_stddev_60s || 0,
        pressure_flow_ratio: reading.pressure_flow_ratio || 0,
        hour_of_day: reading.hour_of_day || 0,
        is_weekend: reading.is_weekend ? 1 : 0,
        label // 'normal' or 'anomaly'
      };

      features.push(feature);
    });

    console.log(
      `[ANOMALY_DETECTOR] Prepared ${features.length} training samples (${label})`
    );

    return features;
  }

  /**
   * Create synthetic training data for demonstration
   */
  createSyntheticTrainingData() {
    const normalData = [];
    const anomalyData = [];

    console.log('[ANOMALY_DETECTOR] Generating synthetic training data...');

    // Generate normal data (stable pressure and flow)
    for (let i = 0; i < 500; i++) {
      normalData.push({
        pressure: 50 + (Math.random() - 0.5) * 4,
        flow: 10 + (Math.random() - 0.5) * 2,
        pressure_rate_of_change: (Math.random() - 0.5) * 0.5,
        flow_rate_of_change: (Math.random() - 0.5) * 0.3,
        pressure_ma_30s: 50 + (Math.random() - 0.5) * 2,
        flow_ma_30s: 10 + (Math.random() - 0.5) * 1,
        pressure_stddev_60s: 0.5 + Math.random() * 1,
        flow_stddev_60s: 0.3 + Math.random() * 0.7,
        pressure_flow_ratio: 5 + (Math.random() - 0.5) * 0.5,
        hour_of_day: Math.floor(Math.random() * 24),
        is_weekend: Math.random() < 0.3,
        label: 'normal'
      });
    }

    // Generate anomaly data (leak scenarios)
    // Critical leak
    for (let i = 0; i < 100; i++) {
      anomalyData.push({
        pressure: 30 + (Math.random() - 0.5) * 5,
        flow: 25 + (Math.random() - 0.5) * 5,
        pressure_rate_of_change: -5 + (Math.random() - 0.5) * 2,
        flow_rate_of_change: 5 + (Math.random() - 0.5) * 2,
        pressure_ma_30s: 32 + (Math.random() - 0.5) * 3,
        flow_ma_30s: 24 + (Math.random() - 0.5) * 2,
        pressure_stddev_60s: 2 + Math.random() * 2,
        flow_stddev_60s: 1.5 + Math.random() * 1.5,
        pressure_flow_ratio: 1.5 + (Math.random() - 0.5) * 0.5,
        hour_of_day: Math.floor(Math.random() * 24),
        is_weekend: Math.random() < 0.3,
        label: 'anomaly'
      });
    }

    // Minor leak
    for (let i = 0; i < 80; i++) {
      anomalyData.push({
        pressure: 43 + (Math.random() - 0.5) * 3,
        flow: 12 + (Math.random() - 0.5) * 3,
        pressure_rate_of_change: -0.5 + (Math.random() - 0.5) * 0.3,
        flow_rate_of_change: 0.3 + (Math.random() - 0.5) * 0.2,
        pressure_ma_30s: 44 + (Math.random() - 0.5) * 2,
        flow_ma_30s: 11.5 + (Math.random() - 0.5) * 1.5,
        pressure_stddev_60s: 1.2 + Math.random() * 0.8,
        flow_stddev_60s: 0.8 + Math.random() * 0.6,
        pressure_flow_ratio: 3.8 + (Math.random() - 0.5) * 0.5,
        hour_of_day: Math.floor(Math.random() * 24),
        is_weekend: Math.random() < 0.3,
        label: 'anomaly'
      });
    }

    // Ratio anomaly
    for (let i = 0; i < 70; i++) {
      anomalyData.push({
        pressure: 48 + (Math.random() - 0.5) * 2,
        flow: 18 + (Math.random() - 0.5) * 3,
        pressure_rate_of_change: (Math.random() - 0.5) * 0.3,
        flow_rate_of_change: (Math.random() - 0.5) * 0.5,
        pressure_ma_30s: 48 + (Math.random() - 0.5) * 1.5,
        flow_ma_30s: 17 + (Math.random() - 0.5) * 2,
        pressure_stddev_60s: 0.6 + Math.random() * 0.5,
        flow_stddev_60s: 0.9 + Math.random() * 0.7,
        pressure_flow_ratio: 2.7 + (Math.random() - 0.5) * 0.4,
        hour_of_day: Math.floor(Math.random() * 24),
        is_weekend: Math.random() < 0.3,
        label: 'anomaly'
      });
    }

    const trainingData = [...normalData, ...anomalyData];

    console.log(`[ANOMALY_DETECTOR] ✓ Synthetic data generated`);
    console.log(`  Normal samples: ${normalData.length}`);
    console.log(`  Anomaly samples: ${anomalyData.length}`);
    console.log(`  Total training samples: ${trainingData.length}`);

    return trainingData;
  }

  /**
   * Train the model
   */
  train(trainingData) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log('[ANOMALY_DETECTOR] Starting model training...');
    console.log(`${'═'.repeat(80)}\n`);

    const startTime = Date.now();

    try {
      this.model.train(trainingData);
      this.performanceMetrics.trainingData = trainingData;

      const trainingTime = Date.now() - startTime;
      console.log(`[ANOMALY_DETECTOR] Training time: ${trainingTime}ms`);
      console.log(`${'═'.repeat(80)}\n`);

      return {
        success: true,
        trainingTime,
        modelState: this.model.getModelState()
      };
    } catch (error) {
      console.error('[ANOMALY_DETECTOR] Training failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Make prediction on a single sample
   */
  predict(sample) {
    if (!this.model.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    const prediction = this.model.predict(sample);

    return {
      anomalyScore: Math.round(prediction.anomalyScore * 10000) / 100, // 0-100%
      isAnomaly: prediction.isAnomaly,
      pathLength: Math.round(prediction.pathLength * 100) / 100,
      confidence: Math.round(Math.abs(prediction.anomalyScore - 0.5) * 2 * 10000) / 100 // Confidence % from 0 to 100
    };
  }

  /**
   * Batch prediction with performance evaluation
   */
  predictBatch(samples, trueLabels = null) {
    const predictions = [];
    let confusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };

    samples.forEach((sample, idx) => {
      const pred = this.predict(sample);
      predictions.push({
        index: idx,
        ...pred,
        actualLabel: trueLabels ? trueLabels[idx] : null
      });

      // Calculate confusion matrix if true labels provided
      if (trueLabels) {
        const predictedLabel = pred.isAnomaly ? 'anomaly' : 'normal';
        const actualLabel = trueLabels[idx];

        if (actualLabel === 'anomaly' && predictedLabel === 'anomaly') {
          confusionMatrix.tp++;
        } else if (actualLabel === 'normal' && predictedLabel === 'anomaly') {
          confusionMatrix.fp++;
        } else if (actualLabel === 'normal' && predictedLabel === 'normal') {
          confusionMatrix.tn++;
        } else if (actualLabel === 'anomaly' && predictedLabel === 'normal') {
          confusionMatrix.fn++;
        }
      }
    });

    this.performanceMetrics.predictions = predictions;
    if (trueLabels) {
      this.performanceMetrics.truePositives = confusionMatrix.tp;
      this.performanceMetrics.falsePositives = confusionMatrix.fp;
      this.performanceMetrics.trueNegatives = confusionMatrix.tn;
      this.performanceMetrics.falseNegatives = confusionMatrix.fn;
    }

    return { predictions, confusionMatrix };
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics() {
    const { tp, fp, tn, fn } = this.performanceMetrics;

    const accuracy = (tp + tn) / (tp + fp + tn + fn);
    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    const specificity = tn / (tn + fp);
    const f1Score = (2 * precision * recall) / (precision + recall);

    return {
      accuracy: Math.round(accuracy * 10000) / 100,
      precision: Math.round(precision * 10000) / 100,
      recall: Math.round(recall * 10000) / 100,
      specificity: Math.round(specificity * 10000) / 100,
      f1Score: Math.round(f1Score * 10000) / 100,
      confusionMatrix: {
        truePositives: tp,
        falsePositives: fp,
        trueNegatives: tn,
        falseNegatives: fn
      }
    };
  }

  /**
   * Log performance metrics
   */
  logMetrics() {
    const metrics = this.calculateMetrics();

    console.log(`\n${'═'.repeat(80)}`);
    console.log('[PERFORMANCE METRICS]');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Accuracy:   ${metrics.accuracy}%`);
    console.log(`Precision:  ${metrics.precision}%`);
    console.log(`Recall:     ${metrics.recall}%`);
    console.log(`Specificity:${metrics.specificity}%`);
    console.log(`F1 Score:   ${metrics.f1Score}`);
    console.log(`${'─'.repeat(80)}`);
    console.log('[CONFUSION MATRIX]');
    console.log(`True Positives:  ${metrics.confusionMatrix.truePositives}`);
    console.log(`False Positives: ${metrics.confusionMatrix.falsePositives}`);
    console.log(`True Negatives:  ${metrics.confusionMatrix.trueNegatives}`);
    console.log(`False Negatives: ${metrics.confusionMatrix.falseNegatives}`);
    console.log(`${'═'.repeat(80)}\n`);
  }

  /**
   * Save model to disk
   */
  saveModel(filename = 'anomaly_model.json') {
    if (!this.model.isTrained) {
      console.error('[ANOMALY_DETECTOR] Model not trained. Cannot save.');
      return false;
    }

    const modelPath = path.join(this.modelPath, filename);
    const modelData = {
      timestamp: getCurrentTimestamp(),
      isTrained: this.model.isTrained,
      numTrees: this.model.numTrees,
      sampleSize: this.model.sampleSize,
      features: this.model.features,
      featureMeans: this.model.featureMeans,
      featureStdDevs: this.model.featureStdDevs,
      metrics: this.calculateMetrics()
    };

    try {
      fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
      console.log(`[ANOMALY_DETECTOR] ✓ Model saved to: ${modelPath}`);
      console.log(`  File size: ${(fs.statSync(modelPath).size / 1024).toFixed(2)} KB`);
      return true;
    } catch (error) {
      console.error(`[ANOMALY_DETECTOR] Failed to save model:`, error.message);
      return false;
    }
  }

  /**
   * Load model from disk
   */
  loadModel(filename = 'anomaly_model.json') {
    const modelPath = path.join(this.modelPath, filename);

    if (!fs.existsSync(modelPath)) {
      console.error(`[ANOMALY_DETECTOR] Model file not found: ${modelPath}`);
      return false;
    }

    try {
      const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));

      this.model.isTrained = modelData.isTrained;
      this.model.numTrees = modelData.numTrees;
      this.model.sampleSize = modelData.sampleSize;
      this.model.features = modelData.features;
      this.model.featureMeans = modelData.featureMeans;
      this.model.featureStdDevs = modelData.featureStdDevs;

      console.log(`[ANOMALY_DETECTOR] ✓ Model loaded from: ${modelPath}`);
      console.log(`  Features: ${modelData.features.length}`);
      console.log(`  Accuracy: ${modelData.metrics.accuracy}%`);

      return true;
    } catch (error) {
      console.error(`[ANOMALY_DETECTOR] Failed to load model:`, error.message);
      return false;
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    const state = this.model.getModelState();
    const metrics = this.model.isTrained ? this.calculateMetrics() : null;

    return {
      isTrained: state.isTrained,
      numTrees: state.numTrees,
      sampleSize: state.sampleSize,
      features: state.features,
      metrics
    };
  }

  /**
   * Reset detector
   */
  reset() {
    this.model = new IsolationForest(100, 256);
    this.performanceMetrics = {
      trainingData: null,
      predictions: [],
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0
    };

    console.log('[ANOMALY_DETECTOR] Detector reset');
  }
}

// Create singleton instance
const mlDetector = new MLAnomalyDetector();

module.exports = {
  IsolationForest,
  MLAnomalyDetector,
  mlDetector
};

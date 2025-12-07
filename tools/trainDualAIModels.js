#!/usr/bin/env node

/**
 * Dual AI Model System Builder
 * 1. LSTM/GRU for Real-Time Anomaly & Leak Detection
 * 2. Regression for Predictive Maintenance & Leak Forecasting
 */

const fs = require('fs');
const path = require('path');

const TRAINING_DATA_DIR = path.join(__dirname, '../backend/training_data');
const MODELS_DIR = path.join(__dirname, '../models');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

console.log('🔨 DUAL AI MODEL BUILDER');
console.log('═'.repeat(80));
console.log('Model 1: LSTM/GRU for Real-Time Anomaly Detection');
console.log('Model 2: Regression for Predictive Maintenance');
console.log('═'.repeat(80) + '\n');

// ============================================================================
// MODEL 1: LSTM/GRU ANOMALY DETECTOR
// ============================================================================

class LSTMTimeSeriesModel {
  constructor(inputSize = 10, sequenceLength = 30, hiddenSize = 64) {
    this.inputSize = inputSize;
    this.sequenceLength = sequenceLength;
    this.hiddenSize = hiddenSize;
    
    // Simplified LSTM-like architecture (since we can't use TensorFlow in pure Node)
    // We'll implement a statistical sequence-based anomaly detector
    this.model = {
      type: 'lstm_statistical',
      inputSize,
      sequenceLength,
      hiddenSize,
      isTrained: false,
      featureMeans: {},
      featureStdDevs: {},
      sequencePatterns: [], // Store normal sequence patterns
      anomalyThreshold: 0.3,
      trainingStats: null
    };
  }

  /**
   * Train on time series sequences
   */
  train(sequences) {
    console.log('[LSTM] Training on', sequences.length, 'sequences');
    
    const stats = {
      means: {},
      stddevs: {},
      patterns: [],
      normalScores: []
    };

    // Calculate feature statistics
    const allValues = {};
    sequences.forEach(seq => {
      seq.forEach(sample => {
        Object.entries(sample).forEach(([key, val]) => {
          if (!allValues[key]) allValues[key] = [];
          if (typeof val === 'number') allValues[key].push(val);
        });
      });
    });

    Object.entries(allValues).forEach(([key, vals]) => {
      stats.means[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((sum, v) => sum + Math.pow(v - stats.means[key], 2), 0) / vals.length;
      stats.stddevs[key] = Math.sqrt(variance);
    });

    // Analyze sequence patterns
    sequences.forEach(seq => {
      const pattern = this._extractPattern(seq, stats.means, stats.stddevs);
      stats.patterns.push(pattern);
      stats.normalScores.push(this._calculateSequenceAnomalyScore(seq, stats.means, stats.stddevs));
    });

    // Calculate anomaly threshold (mean + 2*stddev of normal scores)
    const meanScore = stats.normalScores.reduce((a, b) => a + b, 0) / stats.normalScores.length;
    const stdScore = Math.sqrt(
      stats.normalScores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / stats.normalScores.length
    );
    
    this.model.featureMeans = stats.means;
    this.model.featureStdDevs = stats.stddevs;
    this.model.sequencePatterns = stats.patterns;
    this.model.anomalyThreshold = meanScore + 2 * stdScore;
    this.model.trainingStats = {
      numSequences: sequences.length,
      meanAnomalyScore: meanScore,
      stdAnomalyScore: stdScore
    };
    this.model.isTrained = true;

    console.log('[LSTM] ✓ Trained on', sequences.length, 'sequences');
    console.log('[LSTM] Anomaly threshold:', this.model.anomalyThreshold.toFixed(4));
    console.log('[LSTM] Training Stats:', this.model.trainingStats);
  }

  /**
   * Extract sequence pattern
   */
  _extractPattern(sequence, means, stddevs) {
    const normalized = sequence.map(sample => {
      const norm = {};
      Object.entries(sample).forEach(([key, val]) => {
        if (stddevs[key] > 0) {
          norm[key] = (val - means[key]) / stddevs[key];
        }
      });
      return norm;
    });

    // Pattern: trend + volatility
    return {
      trend: normalized[normalized.length - 1],
      volatility: this._calculateVolatility(normalized)
    };
  }

  /**
   * Calculate sequence volatility
   */
  _calculateVolatility(normalized) {
    const volatility = {};
    const keys = normalized.length > 0 ? Object.keys(normalized[0]) : [];
    
    keys.forEach(key => {
      const values = normalized.map(s => s[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      volatility[key] = Math.sqrt(variance);
    });
    
    return volatility;
  }

  /**
   * Calculate anomaly score for a sequence
   */
  _calculateSequenceAnomalyScore(sequence, means, stddevs) {
    let totalDeviation = 0;
    let count = 0;

    sequence.forEach(sample => {
      Object.entries(sample).forEach(([key, val]) => {
        if (stddevs[key] > 0) {
          const zScore = Math.abs((val - means[key]) / stddevs[key]);
          totalDeviation += Math.min(zScore, 5); // Cap at 5 to avoid outliers
          count++;
        }
      });
    });

    return count > 0 ? totalDeviation / count : 0;
  }

  /**
   * Predict anomaly score for new sequence
   */
  predict(sequence) {
    if (!this.model.isTrained) {
      throw new Error('Model not trained');
    }

    const score = this._calculateSequenceAnomalyScore(sequence, this.model.featureMeans, this.model.featureStdDevs);
    const isAnomaly = score > this.model.anomalyThreshold;

    return {
      anomalyScore: Math.min(1, score / (this.model.anomalyThreshold * 2)),
      rawScore: score,
      threshold: this.model.anomalyThreshold,
      isAnomaly,
      confidence: Math.min(100, (score / this.model.anomalyThreshold) * 100)
    };
  }

  /**
   * Save model to disk
   */
  save(filename) {
    const modelPath = path.join(MODELS_DIR, filename);
    fs.writeFileSync(modelPath, JSON.stringify(this.model, null, 2));
    const sizeMB = (fs.statSync(modelPath).size / 1024 / 1024).toFixed(2);
    console.log(`[LSTM] ✓ Model saved: ${filename} (${sizeMB} MB)`);
  }

  /**
   * Load model from disk
   */
  load(filename) {
    const modelPath = path.join(MODELS_DIR, filename);
    if (!fs.existsSync(modelPath)) {
      console.log(`[LSTM] Model not found: ${filename}`);
      return false;
    }
    this.model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    console.log(`[LSTM] ✓ Model loaded: ${filename}`);
    return true;
  }
}

// ============================================================================
// MODEL 2: REGRESSION FOR PREDICTIVE MAINTENANCE
// ============================================================================

class RegressionMaintenanceModel {
  constructor() {
    this.model = {
      type: 'linear_regression_maintenance',
      isTrained: false,
      features: [],
      weights: {},
      bias: 0,
      featureMeans: {},
      featureStdDevs: {},
      trainingMetrics: null
    };
  }

  /**
   * Train regression model on maintenance data
   */
  train(trainingData) {
    console.log('[REGRESSION] Training on', trainingData.length, 'samples');

    if (trainingData.length === 0) {
      console.error('[REGRESSION] No training data provided');
      return false;
    }

    // Extract features and target
    const features = Object.keys(trainingData[0]).filter(k => k !== 'target');
    this.model.features = features;

    // Normalize features
    features.forEach(feat => {
      const values = trainingData.map(d => d[feat]).filter(v => typeof v === 'number');
      this.model.featureMeans[feat] = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - this.model.featureMeans[feat], 2), 0) / values.length;
      this.model.featureStdDevs[feat] = Math.sqrt(variance);
    });

    // Normalize training data
    const normalized = trainingData.map(sample => {
      const norm = {};
      features.forEach(feat => {
        const mean = this.model.featureMeans[feat];
        const std = this.model.featureStdDevs[feat];
        norm[feat] = std > 0 ? (sample[feat] - mean) / std : 0;
      });
      norm.target = sample.target;
      return norm;
    });

    // Simple linear regression using gradient descent
    this.model.weights = {};
    features.forEach(f => { this.model.weights[f] = 0.1; });
    this.model.bias = 0;

    const learningRate = 0.01;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      normalized.forEach(sample => {
        // Forward pass
        let prediction = this.model.bias;
        features.forEach(feat => {
          prediction += this.model.weights[feat] * sample[feat];
        });

        // Error
        const error = sample.target - prediction;
        totalError += error * error;

        // Backward pass
        this.model.bias += learningRate * error;
        features.forEach(feat => {
          this.model.weights[feat] += learningRate * error * sample[feat];
        });
      });

      if (epoch % 20 === 0) {
        const mse = totalError / normalized.length;
        console.log(`[REGRESSION]   Epoch ${epoch}: MSE = ${mse.toFixed(6)}`);
      }
    }

    // Calculate metrics
    let totalError = 0;
    normalized.forEach(sample => {
      let prediction = this.model.bias;
      features.forEach(feat => {
        prediction += this.model.weights[feat] * sample[feat];
      });
      totalError += Math.pow(sample.target - prediction, 2);
    });

    this.model.trainingMetrics = {
      numSamples: normalized.length,
      finalMSE: totalError / normalized.length,
      features: features.length
    };
    this.model.isTrained = true;

    console.log('[REGRESSION] ✓ Training complete');
    console.log('[REGRESSION] Final MSE:', this.model.trainingMetrics.finalMSE.toFixed(6));
  }

  /**
   * Predict maintenance score
   */
  predict(sample) {
    if (!this.model.isTrained) {
      throw new Error('Model not trained');
    }

    // Normalize input
    const normalized = {};
    this.model.features.forEach(feat => {
      const mean = this.model.featureMeans[feat];
      const std = this.model.featureStdDevs[feat];
      normalized[feat] = std > 0 ? (sample[feat] - mean) / std : 0;
    });

    // Predict
    let prediction = this.model.bias;
    this.model.features.forEach(feat => {
      prediction += this.model.weights[feat] * normalized[feat];
    });

    // Clamp to [0, 1]
    const leakRiskScore = Math.min(1, Math.max(0, prediction));

    return {
      leakRiskScore,
      leakRiskPercent: Math.round(leakRiskScore * 100),
      prediction: prediction,
      estimatedTimeToFailure: this._estimateTimeToFailure(leakRiskScore)
    };
  }

  /**
   * Estimate time to failure (in hours)
   */
  _estimateTimeToFailure(riskScore) {
    if (riskScore < 0.3) return 720; // > 30 days
    if (riskScore < 0.5) return 168; // 7 days
    if (riskScore < 0.7) return 48;  // 2 days
    if (riskScore < 0.85) return 12; // 12 hours
    return 1; // < 1 hour
  }

  /**
   * Save model
   */
  save(filename) {
    const modelPath = path.join(MODELS_DIR, filename);
    fs.writeFileSync(modelPath, JSON.stringify(this.model, null, 2));
    const sizeMB = (fs.statSync(modelPath).size / 1024 / 1024).toFixed(2);
    console.log(`[REGRESSION] ✓ Model saved: ${filename} (${sizeMB} MB)`);
  }

  /**
   * Load model
   */
  load(filename) {
    const modelPath = path.join(MODELS_DIR, filename);
    if (!fs.existsSync(modelPath)) {
      console.log(`[REGRESSION] Model not found: ${filename}`);
      return false;
    }
    this.model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    console.log(`[REGRESSION] ✓ Model loaded: ${filename}`);
    return true;
  }
}

// ============================================================================
// DATA LOADING & PREPROCESSING
// ============================================================================

function loadSensorSequences() {
  console.log('\n[DATA] Loading pump sensor time series sequences...');
  const sensorFile = path.join(TRAINING_DATA_DIR, 'pump_sensor_data/sensor.csv');
  
  if (!fs.existsSync(sensorFile)) {
    console.error('[DATA] Sensor file not found');
    return [];
  }

  try {
    const content = fs.readFileSync(sensorFile, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');
    
    // Create sequences of 30 timesteps
    const sequences = [];
    const sequenceLength = 30;
    const samples = [];

    for (let i = 1; i < Math.min(2000, lines.length); i++) {
      const values = lines[i].split(',');
      const sample = {};
      header.forEach((col, idx) => {
        const val = parseFloat(values[idx]);
        if (!isNaN(val)) sample[col.trim()] = val;
      });
      if (Object.keys(sample).length >= 3) samples.push(sample);
    }

    // Create sliding window sequences
    for (let i = 0; i < samples.length - sequenceLength; i++) {
      sequences.push(samples.slice(i, i + sequenceLength));
    }

    console.log('[DATA] ✓ Loaded', samples.length, 'samples, created', sequences.length, 'sequences');
    return sequences;
  } catch (error) {
    console.error('[DATA] Error loading sensors:', error.message);
    return [];
  }
}

function loadMaintenanceData() {
  console.log('\n[DATA] Loading maintenance/predictive data...');
  const mainFile = path.join(TRAINING_DATA_DIR, 'maintenance_data/predictive_maintenance.csv');
  
  if (!fs.existsSync(mainFile)) {
    console.error('[DATA] Maintenance file not found');
    return [];
  }

  try {
    const content = fs.readFileSync(mainFile, 'utf8');
    const lines = content.trim().split('\n');
    const header = lines[0].split(',');

    const samples = [];
    for (let i = 1; i < Math.min(5000, lines.length); i++) {
      const values = lines[i].split(',');
      const sample = {};
      
      header.forEach((col, idx) => {
        const key = col.trim();
        const val = parseFloat(values[idx]);
        
        if (!isNaN(val)) {
          sample[key] = val;
        }
      });

      // Map Target to regression output (0 = no failure = low risk, 1 = failure = high risk)
      if (sample.Target !== undefined) {
        sample.target = sample.Target; // 0 or 1
      }

      if (Object.keys(sample).length >= 5) samples.push(sample);
    }

    console.log('[DATA] ✓ Loaded', samples.length, 'maintenance samples');
    return samples;
  } catch (error) {
    console.error('[DATA] Error loading maintenance:', error.message);
    return [];
  }
}

// ============================================================================
// MAIN TRAINING EXECUTION
// ============================================================================

async function main() {
  try {
    // Load data
    const sequences = loadSensorSequences();
    const maintenanceData = loadMaintenanceData();

    if (sequences.length === 0 || maintenanceData.length === 0) {
      console.error('❌ Insufficient training data');
      process.exit(1);
    }

    // Train Model 1: LSTM Anomaly Detector
    console.log('\n' + '═'.repeat(80));
    console.log('TRAINING MODEL 1: LSTM/GRU ANOMALY DETECTOR');
    console.log('═'.repeat(80));
    
    const lstmModel = new LSTMTimeSeriesModel(10, 30, 64);
    lstmModel.train(sequences);
    lstmModel.save('lstm_anomaly_detector.json');

    // Train Model 2: Regression Maintenance
    console.log('\n' + '═'.repeat(80));
    console.log('TRAINING MODEL 2: REGRESSION PREDICTIVE MAINTENANCE');
    console.log('═'.repeat(80));
    
    const regressionModel = new RegressionMaintenanceModel();
    regressionModel.train(maintenanceData);
    regressionModel.save('regression_maintenance_model.json');

    // Test predictions
    console.log('\n' + '═'.repeat(80));
    console.log('TESTING PREDICTIONS');
    console.log('═'.repeat(80));

    if (sequences.length > 0) {
      const testSeq = sequences[Math.floor(sequences.length / 2)];
      const lstmPred = lstmModel.predict(testSeq);
      console.log('\n[TEST] LSTM Prediction:');
      console.log('  Anomaly Score:', lstmPred.anomalyScore.toFixed(3));
      console.log('  Is Anomaly:', lstmPred.isAnomaly);
      console.log('  Confidence:', lstmPred.confidence.toFixed(1) + '%');
    }

    if (maintenanceData.length > 0) {
      const testSample = maintenanceData[Math.floor(maintenanceData.length / 2)];
      const regPred = regressionModel.predict(testSample);
      console.log('\n[TEST] Regression Prediction:');
      console.log('  Leak Risk Score:', regPred.leakRiskScore.toFixed(3));
      console.log('  Leak Risk Percent:', regPred.leakRiskPercent + '%');
      console.log('  Estimated Hours to Failure:', regPred.estimatedTimeToFailure);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ TRAINING COMPLETE');
    console.log('═'.repeat(80));
    console.log('\nModels saved:');
    console.log('  1. lstm_anomaly_detector.json');
    console.log('  2. regression_maintenance_model.json');

  } catch (error) {
    console.error('❌ Error during training:', error.message);
    process.exit(1);
  }
}

main();

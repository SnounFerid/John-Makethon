#!/usr/bin/env node

/**
 * Simple Dual AI Model Training
 * Trains LSTM and Regression models for water leak detection
 * Features: pressure, flow, temperature, conductivity
 */

const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, '../models');

// ==================== LSTM ANOMALY DETECTOR ====================

class LSTMModel {
  constructor() {
    this.type = 'lstm_statistical';
    this.features = ['pressure', 'flow', 'temperature', 'conductivity'];
    this.featureMeans = {};
    this.featureStdDevs = {};
    this.anomalyThreshold = 0.9;
    this.trainingStats = {};
    this.isTrained = false;
  }

  train(sequences) {
    console.log('[LSTM] Training on', sequences.length, 'sequences');
    
    const allValues = {};
    this.features.forEach(f => { allValues[f] = []; });

    sequences.forEach(seq => {
      seq.forEach(sample => {
        this.features.forEach(f => {
          if (sample[f] !== undefined) allValues[f].push(sample[f]);
        });
      });
    });

    // Means
    this.features.forEach(f => {
      this.featureMeans[f] = allValues[f].reduce((a, b) => a + b, 0) / allValues[f].length;
    });

    // Std Devs
    this.features.forEach(f => {
      const variance = allValues[f].reduce((sum, val) => sum + Math.pow(val - this.featureMeans[f], 2), 0) / allValues[f].length;
      this.featureStdDevs[f] = Math.sqrt(variance);
    });

    // Anomaly scores
    const anomalyScores = [];
    sequences.forEach(seq => {
      let score = 0;
      seq.forEach(sample => {
        this.features.forEach(f => {
          if (this.featureStdDevs[f] > 0) {
            const z = Math.abs((sample[f] - this.featureMeans[f]) / this.featureStdDevs[f]);
            score += Math.min(z, 5);
          }
        });
      });
      anomalyScores.push(score / (seq.length * this.features.length));
    });

    const meanScore = anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length;
    const stdScore = Math.sqrt(anomalyScores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / anomalyScores.length);

    this.anomalyThreshold = meanScore + stdScore;
    this.trainingStats = {
      numSequences: sequences.length,
      meanAnomalyScore: meanScore,
      stdAnomalyScore: stdScore
    };

    this.isTrained = true;
    console.log('[LSTM] ✓ Trained, threshold:', this.anomalyThreshold.toFixed(4));
    return true;
  }

  predict(sequence) {
    if (!this.isTrained) return null;
    let totalDeviation = 0;
    let count = 0;

    sequence.forEach(sample => {
      this.features.forEach(f => {
        if (this.featureStdDevs[f] && this.featureStdDevs[f] > 0) {
          const z = Math.abs((sample[f] - this.featureMeans[f]) / this.featureStdDevs[f]);
          totalDeviation += Math.min(z, 5);
          count++;
        }
      });
    });

    const score = count > 0 ? totalDeviation / count : 0;
    return {
      score,
      isAnomaly: score > this.anomalyThreshold,
      anomalyPercent: Math.min(100, Math.max(0, (score / this.anomalyThreshold) * 100))
    };
  }

  save(filepath) {
    const data = {
      type: this.type,
      features: this.features,
      featureMeans: this.featureMeans,
      featureStdDevs: this.featureStdDevs,
      anomalyThreshold: this.anomalyThreshold,
      trainingStats: this.trainingStats,
      isTrained: this.isTrained
    };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log('[LSTM] ✓ Model saved:', filepath);
  }
}

// ==================== REGRESSION MODEL ====================

class RegressionModel {
  constructor() {
    this.type = 'linear_regression_leak_prediction';
    this.features = ['pressure', 'flow', 'temperature', 'conductivity'];
    this.weights = {};
    this.featureMeans = {};
    this.featureStdDevs = {};
    this.bias = 0;
    this.isTrained = false;
  }

  train(data, labels) {
    console.log('[REGRESSION] Training on', data.length, 'samples');

    // Initialize weights
    this.features.forEach(f => {
      this.weights[f] = Math.random() * 0.01;
      this.featureMeans[f] = 0;
      this.featureStdDevs[f] = 1;
    });

    // Calculate means and std devs
    this.features.forEach(f => {
      const values = data.map(d => d[f] || 0);
      this.featureMeans[f] = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - this.featureMeans[f], 2), 0) / values.length;
      this.featureStdDevs[f] = Math.sqrt(variance) || 1;
    });

    // Normalize data
    const normalizedData = data.map(d => {
      const normalized = {};
      this.features.forEach(f => {
        normalized[f] = ((d[f] || 0) - this.featureMeans[f]) / this.featureStdDevs[f];
      });
      return normalized;
    });

    // Gradient descent (50 epochs for quick training)
    const lr = 0.01;
    for (let epoch = 0; epoch < 50; epoch++) {
      for (let i = 0; i < normalizedData.length; i++) {
        const sample = normalizedData[i];
        const actual = labels[i] || 0;

        // Prediction
        let prediction = this.bias;
        this.features.forEach(f => {
          prediction += (this.weights[f] || 0) * sample[f];
        });

        prediction = Math.min(1, Math.max(0, prediction));
        const error = prediction - actual;

        // Update weights
        this.features.forEach(f => {
          this.weights[f] -= lr * error * sample[f];
        });

        this.bias -= lr * error;
      }
    }

    this.isTrained = true;
    console.log('[REGRESSION] ✓ Training complete');
    return true;
  }

  predict(sensorData) {
    if (!this.isTrained) return null;

    const normalized = {};
    this.features.forEach(f => {
      normalized[f] = ((sensorData[f] || 0) - this.featureMeans[f]) / this.featureStdDevs[f];
    });

    let prediction = this.bias;
    this.features.forEach(f => {
      prediction += (this.weights[f] || 0) * normalized[f];
    });

    const riskScore = Math.min(1, Math.max(0, prediction));
    return {
      riskScore,
      riskPercent: Math.round(riskScore * 100)
    };
  }

  save(filepath) {
    const data = {
      type: this.type,
      features: this.features,
      weights: this.weights,
      featureMeans: this.featureMeans,
      featureStdDevs: this.featureStdDevs,
      bias: this.bias,
      isTrained: this.isTrained
    };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log('[REGRESSION] ✓ Model saved:', filepath);
  }
}

// ==================== GENERATE TRAINING DATA ====================

function generateTrainingSequences(count = 300) {
  const sequences = [];
  for (let s = 0; s < count; s++) {
    const sequence = [];
    const isAnomaly = Math.random() < 0.3;

    for (let i = 0; i < 30; i++) {
      if (isAnomaly) {
        sequence.push({
          pressure: 20 + Math.random() * 30,
          flow: 40 + Math.random() * 40,
          temperature: 15 + Math.random() * 15,
          conductivity: 400 + Math.random() * 800
        });
      } else {
        sequence.push({
          pressure: 40 + Math.random() * 20,
          flow: 15 + Math.random() * 12,
          temperature: 18 + Math.random() * 8,
          conductivity: 200 + Math.random() * 400
        });
      }
    }
    sequences.push(sequence);
  }
  return sequences;
}

function generateRegressionData(count = 1000) {
  const data = [];
  const labels = [];

  for (let i = 0; i < count; i++) {
    const isLeak = Math.random() < 0.3;

    if (isLeak) {
      data.push({
        pressure: 10 + Math.random() * 20,
        flow: 30 + Math.random() * 40,
        temperature: 15 + Math.random() * 10,
        conductivity: 300 + Math.random() * 600
      });
      labels.push(0.5 + Math.random() * 0.5);
    } else {
      data.push({
        pressure: 40 + Math.random() * 20,
        flow: 15 + Math.random() * 12,
        temperature: 18 + Math.random() * 8,
        conductivity: 200 + Math.random() * 400
      });
      labels.push(Math.random() * 0.3);
    }
  }

  return { data, labels };
}

// ==================== MAIN ====================

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Dual AI Model Training                ║');
  console.log('║  LSTM + Regression for Leak Detection  ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  try {
    // Train LSTM
    console.log('[STEP 1] Training LSTM Anomaly Detector...');
    const lstmModel = new LSTMModel();
    const sequences = generateTrainingSequences(300);
    lstmModel.train(sequences);

    const testSeq = sequences[0];
    const lstmPred = lstmModel.predict(testSeq);
    console.log('[LSTM] Test:', { score: lstmPred.score.toFixed(4), anomaly: lstmPred.anomalyPercent + '%' });

    const lstmPath = path.join(MODEL_DIR, 'lstm_anomaly_detector.json');
    lstmModel.save(lstmPath);

    // Train Regression
    console.log('\n[STEP 2] Training Regression Model...');
    const regModel = new RegressionModel();
    const { data: trainData, labels: trainLabels } = generateRegressionData(1000);
    regModel.train(trainData, trainLabels);

    const testSample = trainData[0];
    const regPred = regModel.predict(testSample);
    console.log('[REGRESSION] Test:', { risk: regPred.riskPercent + '%' });

    const regPath = path.join(MODEL_DIR, 'regression_maintenance_model.json');
    regModel.save(regPath);

    console.log('\n✅ TRAINING COMPLETE');
    console.log('✓ LSTM model saved to:', path.basename(lstmPath));
    console.log('✓ Regression model saved to:', path.basename(regPath));
  } catch (error) {
    console.error('\n❌ TRAINING FAILED:', error.message);
    process.exit(1);
  }
}

main();

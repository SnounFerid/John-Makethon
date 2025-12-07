/**
 * Dual AI Detection System
 * Combines LSTM Anomaly Detection + Regression Predictive Maintenance
 * Real-time leak detection + Future failure prediction
 */

const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, '../models');

class DualAIDetectionSystem {
  constructor() {
    this.lstmModel = null;
    this.regressionModel = null;
    this.sequenceBuffer = []; // Rolling window for LSTM input
    this.maxBufferSize = 30; // LSTM sequence length
    
    this.systemReady = false;
    
    console.log('[DUAL_AI] System initialized');
  }

  /**
   * Load both models from disk
   */
  loadModels() {
    console.log('[DUAL_AI] Loading dual models...');

    // Load LSTM model
    const lstmPath = path.join(MODEL_DIR, 'lstm_anomaly_detector.json');
    if (fs.existsSync(lstmPath)) {
      this.lstmModel = JSON.parse(fs.readFileSync(lstmPath, 'utf8'));
      console.log('[DUAL_AI] ✓ LSTM Anomaly Detector loaded');
    } else {
      console.warn('[DUAL_AI] LSTM model not found');
    }

    // Load Regression model
    const regPath = path.join(MODEL_DIR, 'regression_maintenance_model.json');
    if (fs.existsSync(regPath)) {
      this.regressionModel = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      console.log('[DUAL_AI] ✓ Regression Maintenance Model loaded');
    } else {
      console.warn('[DUAL_AI] Regression model not found');
    }

    this.systemReady = this.lstmModel && this.regressionModel;
    return this.systemReady;
  }

  /**
   * Process real-time sensor reading
   * Returns combined detection: anomaly + predictive
   */
  processReading(sensorData) {
    if (!this.systemReady) {
      return { error: 'Models not loaded' };
    }

    // Add to sequence buffer
    this.sequenceBuffer.push(sensorData);
    if (this.sequenceBuffer.length > this.maxBufferSize) {
      this.sequenceBuffer.shift();
    }

    const result = {
      timestamp: new Date().toISOString(),
      hasEnoughData: this.sequenceBuffer.length >= this.maxBufferSize,
      lstm: null,
      regression: null,
      combined: null
    };

    // If we have enough data, run LSTM detection
    if (this.sequenceBuffer.length === this.maxBufferSize) {
      result.lstm = this._runLSTMDetection();
    }

    // Run regression prediction (always available with single sample)
    result.regression = this._runRegressionPrediction(sensorData);

    // Combine results
    if (result.lstm && result.regression) {
      result.combined = this._combineDetections(result.lstm, result.regression);
    }

    return result;
  }

  /**
   * LSTM Anomaly Detection
   */
  _runLSTMDetection() {
    if (!this.lstmModel || !this.lstmModel.features) {
      return null;
    }

    // Build sequence with only the features the LSTM model expects
    const sequence = this.sequenceBuffer.map(s => {
      const sample = {};
      this.lstmModel.features.forEach(feat => {
        if (feat === 'pressure') sample[feat] = s.pressure || 0;
        else if (feat === 'flow') sample[feat] = s.flow || 0;
        else if (feat === 'temperature') sample[feat] = s.temperature || 0;
        else if (feat === 'conductivity') sample[feat] = s.conductivity || 0;
      });
      return sample;
    });

    const score = this._calculateSequenceAnomalyScore(
      sequence,
      this.lstmModel.featureMeans,
      this.lstmModel.featureStdDevs,
      this.lstmModel.features
    );

    const isAnomaly = score > this.lstmModel.anomalyThreshold;
    const anomalyPercent = Math.min(100, Math.max(0, (score / this.lstmModel.anomalyThreshold) * 100));

    return {
      modelType: 'LSTM Sequence Anomaly',
      rawScore: score.toFixed(4),
      threshold: this.lstmModel.anomalyThreshold.toFixed(4),
      isAnomaly,
      anomalyPercent: Math.round(anomalyPercent),
      confidence: this.lstmModel.trainingStats || { numSequences: 0 }
    };
  }

  /**
   * Calculate sequence anomaly score
   */
  _calculateSequenceAnomalyScore(sequence, means, stddevs, features) {
    let totalDeviation = 0;
    let count = 0;

    sequence.forEach(sample => {
      (features || Object.keys(sample)).forEach(key => {
        const val = sample[key];
        if (stddevs && stddevs[key] && stddevs[key] > 0) {
          const zScore = Math.abs((val - (means[key] || 0)) / stddevs[key]);
          totalDeviation += Math.min(zScore, 5);
          count++;
        }
      });
    });

    return count > 0 ? totalDeviation / count : 0;
  }

  /**
   * Regression Predictive Maintenance
   */
  _runRegressionPrediction(sensorData) {
    if (!this.regressionModel || !this.regressionModel.features) {
      return null;
    }

    // Build feature vector with only expected features
    const features = {};
    this.regressionModel.features.forEach(feat => {
      if (feat === 'pressure') features[feat] = sensorData.pressure || 0;
      else if (feat === 'flow') features[feat] = sensorData.flow || 0;
      else if (feat === 'temperature') features[feat] = sensorData.temperature || 20;
      else if (feat === 'conductivity') features[feat] = sensorData.conductivity || 200;
    });

    // Normalize
    const normalized = {};
    this.regressionModel.features.forEach(feat => {
      const mean = this.regressionModel.featureMeans[feat] || 0;
      const std = this.regressionModel.featureStdDevs[feat] || 1;
      normalized[feat] = ((features[feat] || 0) - mean) / std;
    });

    // Predict
    let prediction = this.regressionModel.bias || 0;
    this.regressionModel.features.forEach(feat => {
      prediction += (this.regressionModel.weights[feat] || 0) * normalized[feat];
    });

    const leakRiskScore = Math.min(1, Math.max(0, prediction));
    const leakRiskPercent = Math.round(leakRiskScore * 100);

    return {
      modelType: 'Regression Maintenance',
      leakRiskScore: leakRiskScore.toFixed(3),
      leakRiskPercent,
      estimatedHoursToFailure: this._estimateTimeToFailure(leakRiskScore),
      prediction: prediction.toFixed(3)
    };
  }

  /**
   * Estimate time to failure
   */
  _estimateTimeToFailure(riskScore) {
    if (riskScore < 0.3) return 720;  // > 30 days
    if (riskScore < 0.5) return 168;  // 7 days
    if (riskScore < 0.7) return 48;   // 2 days
    if (riskScore < 0.85) return 12;  // 12 hours
    return 1; // < 1 hour
  }

  /**
   * Combine LSTM + Regression results
   */
  _combineDetections(lstmResult, regResult) {
    const weight_lstm = 0.6; // Real-time anomaly detection
    const weight_reg = 0.4;  // Predictive maintenance

    const combined_percent = 
      (parseInt(lstmResult.anomalyPercent) * weight_lstm +
       parseInt(regResult.leakRiskPercent) * weight_reg);

    const severity = this._calculateSeverity(combined_percent);

    return {
      combinedLeakProbability: Math.round(combined_percent),
      severity,
      recommendation: this._getRecommendation(combined_percent),
      details: {
        lstm_contribution: `${(lstmResult.anomalyPercent * weight_lstm).toFixed(1)}%`,
        regression_contribution: `${(regResult.leakRiskPercent * weight_reg).toFixed(1)}%`,
        timeToFailure: regResult.estimatedHoursToFailure
      }
    };
  }

  /**
   * Calculate severity level
   */
  _calculateSeverity(probability) {
    if (probability >= 80) return 'CRITICAL';
    if (probability >= 60) return 'HIGH';
    if (probability >= 40) return 'MEDIUM';
    if (probability >= 20) return 'LOW';
    return 'NORMAL';
  }

  /**
   * Get actionable recommendation
   */
  _getRecommendation(probability) {
    if (probability >= 80) 
      return 'EMERGENCY: Immediate inspection required. Isolate affected section.';
    if (probability >= 60)
      return 'URGENT: Schedule inspection within 2-4 hours. Increase monitoring.';
    if (probability >= 40)
      return 'CAUTION: Schedule inspection within 24 hours. Monitor closely.';
    if (probability >= 20)
      return 'ADVISORY: Schedule routine inspection. Normal monitoring.';
    return 'NORMAL: System operating normally. Continue routine monitoring.';
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      systemReady: this.systemReady,
      lstmLoaded: !!this.lstmModel,
      regressionLoaded: !!this.regressionModel,
      bufferSize: this.sequenceBuffer.length,
      maxBufferSize: this.maxBufferSize,
      hasEnoughData: this.sequenceBuffer.length >= this.maxBufferSize
    };
  }
}

module.exports = {
  DualAIDetectionSystem
};

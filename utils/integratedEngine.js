/**
 * Integrated Leak Detection Engine
 * Combines rule-based detection, ML anomaly detection, and predictive maintenance
 * Provides unified interface for all detection systems
 */

const { leakDetector } = require('./leakDetector');
const { mlDetector } = require('./mlAnomalyDetector');
const { preprocessor } = require('./dataPreprocessor');
const { maintenanceSystem } = require('./predictiveMaintenance');
const { getCurrentTimestamp, generateId } = require('./helpers');

class IntegratedLeakDetectionEngine {
  constructor() {
    this.detectionHistory = [];
    this.systemStatus = {
      ruleBasedReady: false,
      mlModelReady: false,
      preprocessorReady: true,
      maintenanceReady: false
    };
    this.alerts = [];
    // Hysteresis settings: require N consecutive ML anomalies before alerting
    this.hysteresisConsecutive = parseInt(process.env.HYSTERESIS_CONSECUTIVE, 10) || 3;
    this.mlConsecutiveAnomalies = 0;
    this.maxHistorySize = 10000;

    console.log('[INTEGRATED_ENGINE] Leak Detection Engine initialized');
    console.log('[INTEGRATED_ENGINE] Available modules:');
    console.log('  ✓ Rule-Based Detection');
    console.log('  ✓ ML Anomaly Detection');
    console.log('  ✓ Data Preprocessing');
    console.log('  ✓ Predictive Maintenance');
  }

  /**
   * Initialize rule-based detection system
   */
  initializeRuleBasedDetection(baselinePressure, baselineFlow) {
    leakDetector.reset();
    leakDetector.setBaseline(baselinePressure, baselineFlow);
    this.systemStatus.ruleBasedReady = true;

    console.log('[INTEGRATED_ENGINE] Rule-based detection initialized');
    return true;
  }

  /**
   * Initialize ML anomaly detection with training
   */
  initializeMLDetection(trainingData = null) {
    mlDetector.reset();

    if (trainingData) {
      mlDetector.train(trainingData);
    } else {
      // Use synthetic data if none provided
      const syntheticData = mlDetector.createSyntheticTrainingData();
      mlDetector.train(syntheticData);
    }

    this.systemStatus.mlModelReady = mlDetector.model.isTrained;

    console.log('[INTEGRATED_ENGINE] ML detection initialized');
    return this.systemStatus.mlModelReady;
  }

  /**
   * Initialize predictive maintenance system with pipe metadata
   */
  initializePredictiveMaintenance(pipeConfigs) {
    maintenanceSystem.reset();

    if (pipeConfigs && Array.isArray(pipeConfigs)) {
      pipeConfigs.forEach(config => {
        maintenanceSystem.registerPipe(config);
      });
    } else {
      // Register default pipe
      maintenanceSystem.registerPipe({
        name: 'Main Distribution Line',
        material: 'Cast Iron',
        diameter: 50,
        length: 500,
        installationDate: Date.now() - 25 * 365 * 24 * 60 * 60 * 1000,
        previousLeakCount: 2
      });
    }

    this.systemStatus.maintenanceReady = maintenanceSystem.pipeSegments.length > 0;

    console.log('[INTEGRATED_ENGINE] Predictive maintenance initialized');
    return this.systemStatus.maintenanceReady;
  }

  /**
   * Process raw sensor reading through all systems
   */
  processReading(rawReading) {
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    // Step 1: Preprocess data
    const features = preprocessor.processReading({
      id,
      timestamp,
      ...rawReading
    });

    if (!features) {
      console.error('[INTEGRATED_ENGINE] Preprocessing failed');
      return null;
    }

    // Step 2: Rule-based detection
    let ruleBasedResult = null;
    if (this.systemStatus.ruleBasedReady) {
      ruleBasedResult = leakDetector.evaluate(features);
    }

    // Step 3: ML anomaly detection
    let mlResult = null;
    if (this.systemStatus.mlModelReady) {
      try {
        const mlPrediction = mlDetector.predict({
          pressure: features.pressure,
          flow: features.flow,
          pressure_rate_of_change: features.pressure_rate_of_change,
          flow_rate_of_change: features.flow_rate_of_change,
          pressure_ma_30s: features.pressure_ma_30s || features.pressure,
          flow_ma_30s: features.flow_ma_30s || features.flow,
          pressure_stddev_60s: features.pressure_stddev_60s || 0.5,
          flow_stddev_60s: features.flow_stddev_60s || 0.3,
          pressure_flow_ratio: features.pressure_flow_ratio,
          hour_of_day: features.hour_of_day,
          is_weekend: features.is_weekend ? 1 : 0,
          // Include engineered features
          pressure_flow_ratio_variance: features.pressure_flow_ratio_variance || 0,
          combined_rate_of_change: features.combined_rate_of_change || 0,
          combined_volatility: features.combined_volatility || 0,
          flow_pressure_interaction: features.flow_pressure_interaction || 0
        });

        mlResult = {
          anomalyScore: mlPrediction.anomalyScore,
          isAnomaly: mlPrediction.isAnomaly,
          confidence: mlPrediction.confidence
        };
      } catch (error) {
        console.error('[INTEGRATED_ENGINE] ML prediction failed:', error.message);
      }
    }

    // Step 4: Add reading to maintenance system
    if (this.systemStatus.maintenanceReady) {
      maintenanceSystem.pipeSegments.forEach(pipe => {
        pipe.addReading({
          timestamp,
          pressure: features.pressure,
          flow: features.flow,
          leak_detected: ruleBasedResult ? ruleBasedResult.is_leak_detected : false,
          anomaly_score: mlResult ? mlResult.anomalyScore / 100 : 0
        });
      });
    }

    // Combine results
    const integratedResult = this._combineDetectionResults(
      id,
      timestamp,
      features,
      ruleBasedResult,
      mlResult
    );

    // Store in history
    this.detectionHistory.push(integratedResult);
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.shift();
    }

    // Generate alerts if needed with hysteresis
    const ruleTriggered = ruleBasedResult && ruleBasedResult.is_leak_detected;

    if (ruleTriggered) {
      // Immediate alert when rule-based detection indicates leak
      this.mlConsecutiveAnomalies = 0;
      this._generateAlert(integratedResult);
    } else if (mlResult && mlResult.isAnomaly) {
      // Increment ML consecutive anomaly counter and only alert when threshold reached
      this.mlConsecutiveAnomalies++;

      if (this.mlConsecutiveAnomalies >= this.hysteresisConsecutive && integratedResult.detection.overallLeakDetected) {
        this._generateAlert(integratedResult);
      }
    } else {
      // Reset counter on normal reading
      this.mlConsecutiveAnomalies = 0;
    }

    return integratedResult;
  }

  /**
   * Combine results from all detection systems
   */
  _combineDetectionResults(id, timestamp, features, ruleResult, mlResult) {
    let leakProbability = 0;
    let severityLevel = 'NORMAL';
    const detectionMethods = [];

    // Incorporate rule-based result
    if (ruleResult) {
      leakProbability += ruleResult.leak_probability * 0.4; // 40% weight
      detectionMethods.push({
        method: 'rule_based',
        probability: ruleResult.leak_probability,
        severity: ruleResult.severity
      });

      if (ruleResult.severity === 'CRITICAL') {
        severityLevel = 'CRITICAL';
      } else if (ruleResult.severity === 'HIGH' && severityLevel !== 'CRITICAL') {
        severityLevel = 'HIGH';
      }
    }

    // Incorporate ML result
    if (mlResult) {
      leakProbability += mlResult.anomalyScore * 0.6; // 60% weight
      detectionMethods.push({
        method: 'ml_anomaly',
        probability: mlResult.anomalyScore,
        confidence: mlResult.confidence
      });

      if (mlResult.isAnomaly && severityLevel === 'NORMAL') {
        severityLevel = 'MEDIUM';
      }
    }

    // Normalize probability
    leakProbability = Math.min(100, leakProbability);

    return {
      id,
      timestamp,
      readings: {
        pressure: features.pressure,
        flow: features.flow,
        leak_status_sensor: features.leak_status,
        valve_state: features.valve_state
      },
      engineeredFeatures: {
        pressure_rate_of_change: features.pressure_rate_of_change,
        flow_rate_of_change: features.flow_rate_of_change,
        pressure_ma_30s: features.pressure_ma_30s,
        flow_ma_30s: features.flow_ma_30s,
        pressure_flow_ratio: features.pressure_flow_ratio
      },
      detection: {
        overallLeakDetected: leakProbability >= 50,
        overallProbability: Math.round(leakProbability),
        severityLevel,
        confidenceScore: this._calculateConfidence(ruleResult, mlResult),
        detectionMethods
      },
      qualityMetrics: {
        dataQualityScore: features.data_quality_score,
        isOutlier: features.is_outlier,
        pressureSpikeDetected: features.pressure_spike_detected,
        flowSpikeDetected: features.flow_spike_detected
      }
    };
  }

  /**
   * Calculate overall confidence in detection
   */
  _calculateConfidence(ruleResult, mlResult) {
    let confidence = 0;
    let count = 0;

    if (ruleResult) {
      confidence += ruleResult.triggered_count > 0 ? 80 : 20;
      count++;
    }

    if (mlResult) {
      confidence += mlResult.confidence;
      count++;
    }

    return count > 0 ? Math.round(confidence / count) : 50;
  }

  /**
   * Generate alert for potential leak
   */
  _generateAlert(detectionResult) {
    const alert = {
      id: generateId(),
      timestamp: getCurrentTimestamp(),
      severity: detectionResult.detection.severityLevel,
      probability: detectionResult.detection.overallProbability,
      message: this._generateAlertMessage(detectionResult),
      readings: detectionResult.readings,
      recommendedActions: this._generateRecommendedActions(detectionResult)
    };

    // Add lifecycle fields for acknowledgement/resolution and notifications
    alert.acknowledged = false;
    alert.acknowledgedBy = null;
    alert.acknowledgedAt = null;
    alert.acknowledgeNotes = null;
    alert.resolved = false;
    alert.resolvedBy = null;
    alert.resolvedAt = null;
    alert.resolveNotes = null;
    alert.notificationsSent = [];

    this.alerts.push(alert);
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    console.error(
      `[INTEGRATED_ENGINE] 🚨 ALERT: ${alert.message} (${alert.probability}% probability)`
    );

    return alert;
  }

  /**
   * Generate alert message
   */
  _generateAlertMessage(detectionResult) {
    const probability = detectionResult.detection.overallProbability;
    const severity = detectionResult.detection.severityLevel;

    if (probability >= 80 && severity === 'CRITICAL') {
      return 'CRITICAL: Potential major leak detected. Immediate action required.';
    } else if (probability >= 60) {
      return 'HIGH: Strong indication of leak. Recommend immediate inspection.';
    } else if (probability >= 50) {
      return 'MEDIUM: Possible leak detected. Schedule inspection soon.';
    }

    return 'LOW: Minor anomaly detected. Monitor closely.';
  }

  /**
   * Generate recommended actions
   */
  _generateRecommendedActions(detectionResult) {
    const actions = [];
    const { overallProbability, severityLevel } = detectionResult.detection;
    const { pressure, flow } = detectionResult.readings;

    if (severityLevel === 'CRITICAL') {
      actions.push('IMMEDIATE: Close isolation valve if available');
      actions.push('IMMEDIATE: Notify maintenance team');
      actions.push('IMMEDIATE: Prepare for emergency repair');
    } else if (severityLevel === 'HIGH') {
      actions.push('URGENT: Schedule inspection within 1-2 hours');
      actions.push('URGENT: Monitor pressure and flow closely');
      actions.push('URGENT: Alert maintenance team');
    } else {
      actions.push('ROUTINE: Schedule inspection within 24 hours');
      actions.push('ROUTINE: Increase monitoring frequency');
    }

    // Pressure-specific actions
    if (pressure < 20) {
      actions.push('Check for major leaks or pipe rupture');
    } else if (pressure < 35) {
      actions.push('Investigate pressure loss');
    }

    // Flow-specific actions
    if (flow > 40) {
      actions.push('Check for abnormal flow conditions');
    }

    return actions;
  }

  /**
   * Get recent detections
   */
  getRecentDetections(count = 100) {
    return this.detectionHistory.slice(-count);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 50) {
    return this.alerts.slice(-count);
  }

  /**
   * Analyze historical data for patterns
   */
  analyzeHistoricalPatterns() {
    if (this.detectionHistory.length === 0) {
      return null;
    }

    const detections = this.detectionHistory;
    const leakDetections = detections.filter(d => d.detection.overallLeakDetected);

    const avgProbability =
      detections.reduce((sum, d) => sum + d.detection.overallProbability, 0) /
      detections.length;

    const severityCounts = {
      CRITICAL: detections.filter(d => d.detection.severityLevel === 'CRITICAL').length,
      HIGH: detections.filter(d => d.detection.severityLevel === 'HIGH').length,
      MEDIUM: detections.filter(d => d.detection.severityLevel === 'MEDIUM').length,
      NORMAL: detections.filter(d => d.detection.severityLevel === 'NORMAL').length
    };

    return {
      totalDetections: detections.length,
      leakDetections: leakDetections.length,
      leakDetectionRate: ((leakDetections.length / detections.length) * 100).toFixed(2) + '%',
      averageProbability: Math.round(avgProbability),
      maxProbability: Math.max(...detections.map(d => d.detection.overallProbability)),
      minProbability: Math.min(...detections.map(d => d.detection.overallProbability)),
      severityCounts,
      averageConfidence: Math.round(
        detections.reduce((sum, d) => sum + d.detection.confidenceScore, 0) / detections.length
      )
    };
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      status: 'OPERATIONAL',
      timestamp: getCurrentTimestamp(),
      systems: this.systemStatus,
      statistics: {
        totalDetections: this.detectionHistory.length,
        totalAlerts: this.alerts.length,
        averageDataQuality:
          this.detectionHistory.length > 0
            ? Math.round(
                (this.detectionHistory.reduce(
                  (sum, d) => sum + d.qualityMetrics.dataQualityScore,
                  0
                ) /
                  this.detectionHistory.length) *
                  100
              ) / 100
            : 0
      }
    };
  }

  /**
   * Reset engine
   */
  reset() {
    leakDetector.reset();
    mlDetector.reset();
    preprocessor.reset();
    maintenanceSystem.reset();

    this.detectionHistory = [];
    this.alerts = [];
    this.systemStatus = {
      ruleBasedReady: false,
      mlModelReady: false,
      preprocessorReady: true,
      maintenanceReady: false
    };

    console.log('[INTEGRATED_ENGINE] Engine reset');
  }

  /**
   * Get comprehensive system report
   */
  getComprehensiveReport() {
    const patterns = this.analyzeHistoricalPatterns();
    const status = this.getSystemStatus();
    const maintenanceAssessment =
      this.systemStatus.maintenanceReady ? maintenanceSystem.generateReport() : null;

    return {
      timestamp: new Date().toISOString(),
      systemStatus: status,
      detectionPatterns: patterns,
      recentAlerts: this.getRecentAlerts(10),
      maintenanceAssessment,
      systemHealth: this._assessSystemHealth(patterns, status)
    };
  }

  /**
   * Assess overall system health
   */
  _assessSystemHealth(patterns, status) {
    if (!patterns) {
      return 'UNKNOWN';
    }

    const leakRate = parseFloat(patterns.leakDetectionRate);

    if (leakRate > 50) {
      return 'CRITICAL';
    } else if (leakRate > 30) {
      return 'WARNING';
    } else if (leakRate > 10) {
      return 'DEGRADED';
    } else if (leakRate > 5) {
      return 'CAUTION';
    }

    return 'HEALTHY';
  }
}

// Create singleton instance
const integratedEngine = new IntegratedLeakDetectionEngine();

module.exports = {
  IntegratedLeakDetectionEngine,
  integratedEngine
};

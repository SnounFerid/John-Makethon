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
    // Track active anomalies to prevent duplicate alerts per event
    this.activeAnomalies = {
      ruleBasedActive: false,
      mlBasedActive: false
    };
    // Track last alert probability to trigger new alerts on 20%+ deviation
    this.lastAlertProbability = 0;
    // Track last alert severity for reference
    this.lastAlertSeverity = 'NORMAL';
    
    // Smoothing filter: rolling average to reduce probability fluctuation
    this.probabilityWindow = [];
    this.smoothingWindow = 15; // Increased from 5 to 15 for much smoother results (~15 seconds)

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
      // PRIORITY 1: Try to load real trained model first
      console.log('[INTEGRATED_ENGINE] Attempting to load real trained model...');
      const realModelLoaded = mlDetector.loadModel('real_data_trained_model_small.json');
      
      if (realModelLoaded) {
        console.log('[INTEGRATED_ENGINE] ✓ Real trained model loaded successfully');
      } else {
        // PRIORITY 2: Fallback to synthetic data if real model not available
        console.warn('[INTEGRATED_ENGINE] Real model not found, training synthetic model...');
        const syntheticData = mlDetector.createSyntheticTrainingData();
        mlDetector.train(syntheticData.combined);
        console.log('[INTEGRATED_ENGINE] ✓ Synthetic model trained as fallback');
      }
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
    
    // IMPROVEMENT 1: Apply smoothing filter to reduce probability fluctuation
    this.probabilityWindow.push(integratedResult.detection.overallProbability);
    if (this.probabilityWindow.length > this.smoothingWindow) {
      this.probabilityWindow.shift();
    }
    
    // Use smoothed probability if we have enough samples, otherwise use raw
    let smoothedProbability = integratedResult.detection.overallProbability;
    if (this.probabilityWindow.length >= 5) {
      // Exponential weighted moving average: much more weight on recent values
      // This creates a very smooth curve that follows trends
      const alpha = 0.7; // Higher alpha = more weight on recent values
      let ewma = this.probabilityWindow[0];
      for (let i = 1; i < this.probabilityWindow.length; i++) {
        ewma = alpha * this.probabilityWindow[i] + (1 - alpha) * ewma;
      }
      smoothedProbability = ewma;
    }
    
    const currentSeverity = integratedResult.detection.severityLevel;
    
    // FIXED ALERT LOGIC: Simple rule-based alert triggering
    // 1. If probability is 0-20%, reset state (no leak)
    // 2. If probability crosses 20% threshold and is different from last alert by 20%, create alert
    // 3. Prevent alert spam by checking against history
    
    if (smoothedProbability < 15) {
      // No leak detected - reset state ONLY if last few readings confirm no leak
      if (this.probabilityWindow.length > 0) {
        // Check if last 3 readings all below 15%
        const recentReadings = this.probabilityWindow.slice(-3);
        const allLowReadings = recentReadings.every(p => p < 15);
        if (allLowReadings) {
          this.lastAlertProbability = 0;
          this.lastAlertSeverity = 'NORMAL';
          this.mlConsecutiveAnomalies = 0;
        }
      }
    } else if (smoothedProbability >= 20) {
      // Potential leak detected (probability >= 20%)
      const mostRecentAlertProbability = this.alerts.length > 0 ? this.alerts[this.alerts.length - 1].probability : this.lastAlertProbability;
      const probabilityDeviation = Math.abs(smoothedProbability - mostRecentAlertProbability);
      
      // Check if there's an alert within 15% range to avoid duplicate alerts
      let hasAlertWithin15Percent = false;
      if (this.alerts.length > 1) {
        for (let i = 0; i < this.alerts.length - 1; i++) {
          const alertProbability = this.alerts[i].probability;
          const rangeDiff = Math.abs(smoothedProbability - alertProbability);
          if (rangeDiff <= 15) {
            hasAlertWithin15Percent = true;
            break;
          }
        }
      }
      
      // Create alert if: 20%+ deviation from last alert AND no alert in 15% range exists
      const shouldAlert = probabilityDeviation >= 20 && !hasAlertWithin15Percent;
      
      if (shouldAlert) {
        // Update the smoothed probability in integratedResult before alert generation
        integratedResult.detection.overallProbability = smoothedProbability;
        this.lastAlertProbability = smoothedProbability;
        this._generateAlert(integratedResult);
        // Update alert with smoothed probability
        if (this.alerts.length > 0) {
          const lastAlert = this.alerts[this.alerts.length - 1];
          lastAlert.probability = Math.round(smoothedProbability);
          lastAlert.smoothed = true;
        }
      }
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
      leakProbability += ruleResult.leak_probability * 0.3; // 30% weight for rule-based
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

    // Incorporate ML result - use higher weight since ML is more reliable for anomalies
    if (mlResult) {
      // anomalyScore is 0-1, convert to 0-100 for probability
      const mlProbability = mlResult.anomalyScore * 100;
      leakProbability += mlProbability * 0.7; // 70% weight for ML-based (higher weight)
      detectionMethods.push({
        method: 'ml_anomaly',
        probability: mlProbability,
        confidence: mlResult.confidence
      });

      if (mlResult.isAnomaly && severityLevel === 'NORMAL') {
        severityLevel = 'MEDIUM';
      }
    }

    // IMPROVED: If neither detector found a leak, probability should drop to 0
    if (!ruleResult || ruleResult.leak_probability === 0) {
      if (!mlResult || !mlResult.isAnomaly) {
        leakProbability = 0;
      }
    }

    // Normalize probability
    leakProbability = Math.min(100, Math.max(0, leakProbability));

    // Recalculate severity based on final probability (realistic thresholds)
    if (leakProbability >= 80) {
      severityLevel = 'CRITICAL';
    } else if (leakProbability >= 65) {
      severityLevel = 'HIGH';
    } else if (leakProbability >= 50) {
      severityLevel = 'MEDIUM';
    } else if (leakProbability >= 35) {
      severityLevel = 'LOW';
    } else {
      severityLevel = 'NORMAL';
    }

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
        overallLeakDetected: leakProbability >= 65,
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
   * Generate random location for proof-of-concept alerts
   */
  _generateRandomLocation() {
    const locations = [
      'Zone A - Main Distribution',
      'Zone B - East Wing',
      'Zone C - West Wing',
      'Zone D - North Sector',
      'Zone E - South Sector',
      'Basement Level 1',
      'Basement Level 2',
      'Sub-station 1',
      'Sub-station 2',
      'Main Valve Chamber'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Generate alert for potential leak
   */
  _generateAlert(detectionResult) {
    const alert = {
      id: generateId(),
      timestamp: getCurrentTimestamp(),
      severity: detectionResult.detection.severityLevel,
      // Ensure probability is available and provide a sensible fallback
      probability: (function () {
        const p = detectionResult.detection.overallProbability;
        if (p && typeof p === 'number' && p > 0) return Math.round(p);

        // Fallback: use the highest method probability if available
        const methods = detectionResult.detection.detectionMethods || [];
        let max = 0;
        methods.forEach(m => {
          if (m && typeof m.probability === 'number') {
            max = Math.max(max, m.probability);
          }
        });
        return Math.round(max || 0);
      })(),
      // include the detection snapshot so UI can access more details safely
      detection: detectionResult.detection,
      location: this._generateRandomLocation(),
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

    // Log alert and the detection result for debugging mapping issues
    try {
      console.error(
        `[INTEGRATED_ENGINE] 🚨 ALERT: ${alert.message} (${alert.probability}% probability) [${alert.location}]`
      );
      console.dir({ detectionResultSummary: detectionResult.detection, alert }, { depth: 4 });
    } catch (e) {
      console.error('[INTEGRATED_ENGINE] Failed to log alert object', e && e.message);
    }

    return alert;
  }

  /**
   * Generate alert message
   */
  _generateAlertMessage(detectionResult) {
    const probability = detectionResult.detection.overallProbability;
    const severity = detectionResult.detection.severityLevel;

    if (severity === 'CRITICAL' || probability >= 80) {
      return `CRITICAL (${probability}%): Major leak likely detected. Immediate action required. Emergency isolation recommended.`;
    } else if (severity === 'HIGH' || probability >= 65) {
      return `HIGH (${probability}%): Strong indication of leak. Immediate inspection and monitoring recommended.`;
    } else if (severity === 'MEDIUM' || probability >= 50) {
      return `MEDIUM (${probability}%): Possible leak detected. Schedule inspection and increase monitoring frequency.`;
    } else if (severity === 'LOW' || probability >= 35) {
      return `LOW (${probability}%): Minor anomaly detected. Monitor system closely for changes.`;
    }

    return `NORMAL (${probability}%): Nominal operation. Continue routine monitoring.`;
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
   * Clear active anomalies (call when an alert is resolved to allow a new alert if anomaly resumes)
   */
  clearActiveAnomalies() {
    this.activeAnomalies.ruleBasedActive = false;
    this.activeAnomalies.mlBasedActive = false;
    this.mlConsecutiveAnomalies = 0;
    console.log('[INTEGRATED_ENGINE] Active anomalies cleared');
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
    this.activeAnomalies = {
      ruleBasedActive: false,
      mlBasedActive: false
    };
    this.lastAlertProbability = 0;
    this.lastAlertSeverity = 'NORMAL';

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

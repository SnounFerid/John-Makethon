/**
 * Dual AI Integrated Leak Detection Engine
 * Combines:
 * - LSTM: Real-time sequential anomaly detection
 * - Regression: Predictive maintenance & leak forecasting
 * - Rule-based: Traditional pressure/flow rules
 * - Data Preprocessing: Feature engineering
 */

const { leakDetector } = require('./leakDetector');
const { DualAIDetectionSystem } = require('./dualAIDetector');
const { preprocessor } = require('./dataPreprocessor');
const { maintenanceSystem } = require('./predictiveMaintenance');
const { getCurrentTimestamp, generateId } = require('./helpers');

class DualAIIntegratedEngine {
  constructor() {
    this.dualAI = new DualAIDetectionSystem();
    this.detectionHistory = [];
    this.systemStatus = {
      ruleBasedReady: false,
      dualAIReady: false,
      preprocessorReady: true,
      maintenanceReady: false
    };
    this.alerts = [];
    this.lastAlertProbability = 0;
    this.lastAlertSeverity = 'NORMAL';
    this.secondLastAlertProbability = 0; // Track alert before last
    
    // Smoothing
    this.probabilityWindow = [];
    this.smoothingWindow = 15;

    console.log('[DUAL_AI_ENGINE] ✓ Integrated Dual AI Engine initialized');
    console.log('[DUAL_AI_ENGINE] Available modules:');
    console.log('  ✓ LSTM Anomaly Detection (Sequential)');
    console.log('  ✓ Regression Predictive Maintenance (Forecasting)');
    console.log('  ✓ Rule-Based Detection (Traditional)');
    console.log('  ✓ Data Preprocessing (Features)');
  }

  /**
   * Initialize rule-based detection
   */
  initializeRuleBasedDetection(baselinePressure, baselineFlow) {
    leakDetector.reset();
    leakDetector.setBaseline(baselinePressure, baselineFlow);
    this.systemStatus.ruleBasedReady = true;
    console.log('[DUAL_AI_ENGINE] Rule-based detection initialized');
    return true;
  }

  /**
   * Initialize dual AI system (LSTM + Regression)
   */
  initializeDualAI() {
    const loaded = this.dualAI.loadModels();
    if (loaded) {
      console.log('[DUAL_AI_ENGINE] ✓ Dual AI models loaded successfully');
      this.systemStatus.dualAIReady = true;
    } else {
      console.warn('[DUAL_AI_ENGINE] ⚠️  Dual AI models not found, using rule-based only');
    }
    return loaded;
  }

  /**
   * Initialize predictive maintenance
   */
  initializePredictiveMaintenance(pipeConfigs) {
    maintenanceSystem.reset();
    if (pipeConfigs && Array.isArray(pipeConfigs)) {
      pipeConfigs.forEach(config => maintenanceSystem.registerPipe(config));
    } else {
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
    console.log('[DUAL_AI_ENGINE] Predictive maintenance initialized');
    return this.systemStatus.maintenanceReady;
  }

  /**
   * Main detection processing - combines all systems
   */
  processReading(rawReading) {
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    // Step 1: Preprocess
    const features = preprocessor.processReading({
      id,
      timestamp,
      ...rawReading
    });

    if (!features) {
      console.error('[DUAL_AI_ENGINE] Preprocessing failed');
      return null;
    }

    // Step 2: Rule-based detection
    let ruleBasedResult = null;
    if (this.systemStatus.ruleBasedReady) {
      ruleBasedResult = leakDetector.evaluate(features);
    }

    // Step 3: Dual AI detection (LSTM + Regression)
    let dualAIResult = null;
    if (this.systemStatus.dualAIReady) {
      dualAIResult = this.dualAI.processReading({
        pressure: features.pressure,
        flow: features.flow,
        temperature: features.temperature || 20,
        conductivity: features.conductivity || 200,
        wear: features.wear || 0
      });
    }

    // Step 4: Combine results
    const combinedResult = this._combineAllDetections(
      ruleBasedResult,
      dualAIResult,
      features
    );

    // Step 5: Generate alert if probability changed significantly
    const alert = this._generateAlertIfNeeded(combinedResult, features);

    // Store in history
    this.detectionHistory.push({
      id,
      timestamp,
      features,
      ruleBasedResult,
      dualAIResult,
      combinedResult,
      alert
    });

    if (this.detectionHistory.length > 10000) {
      this.detectionHistory.shift();
    }

    return {
      id,
      timestamp,
      detectionResultSummary: combinedResult,
      alert: alert || null,
      systemStatus: this.systemStatus
    };
  }

  /**
   * Combine rule-based + dual AI results
   */
  _combineAllDetections(ruleResult, dualAIResult, features) {
    const detectionMethods = [];

    // Rule-based contribution (30%)
    if (ruleResult) {
      detectionMethods.push({
        method: 'rule_based',
        probability: ruleResult.leak_probability,
        severity: ruleResult.severity,
        triggered: ruleResult.leak_detected
      });
    }

    // LSTM contribution (40%)
    if (dualAIResult && dualAIResult.lstm) {
      detectionMethods.push({
        method: 'lstm_anomaly',
        probability: dualAIResult.lstm.anomalyPercent,
        isAnomaly: dualAIResult.lstm.isAnomaly,
        confidence: dualAIResult.lstm.confidence
      });
    }

    // Regression contribution (30%)
    if (dualAIResult && dualAIResult.regression) {
      detectionMethods.push({
        method: 'regression_maintenance',
        probability: dualAIResult.regression.leakRiskPercent,
        estimatedHoursToFailure: dualAIResult.regression.estimatedHoursToFailure
      });
    }

    // Calculate weighted average
    let totalProbability = 0;
    const weights = {
      rule_based: 0.30,
      lstm_anomaly: 0.40,
      regression_maintenance: 0.30
    };

    if (ruleResult && ruleResult.leak_probability) {
      totalProbability += ruleResult.leak_probability * weights.rule_based;
    }

    if (dualAIResult?.lstm?.anomalyPercent) {
      totalProbability += dualAIResult.lstm.anomalyPercent * weights.lstm_anomaly;
    }

    if (dualAIResult?.regression?.leakRiskPercent) {
      totalProbability += dualAIResult.regression.leakRiskPercent * weights.regression_maintenance;
    }

    // Apply smoothing
    this.probabilityWindow.push(totalProbability);
    if (this.probabilityWindow.length > this.smoothingWindow) {
      this.probabilityWindow.shift();
    }
    const smoothedProbability = this.probabilityWindow.reduce((a, b) => a + b, 0) / this.probabilityWindow.length;

    // Determine severity
    const severity = this._calculateSeverity(smoothedProbability);
    const leakDetected = smoothedProbability >= 50;

    return {
      overallLeakDetected: leakDetected,
      overallProbability: Math.round(smoothedProbability),
      severityLevel: severity,
      confidenceScore: this._calculateConfidence(detectionMethods),
      detectionMethods,
      rawProbability: totalProbability,
      timeToFailure: dualAIResult?.regression?.estimatedHoursToFailure || null
    };
  }

  /**
   * Calculate confidence score
   */
  _calculateConfidence(detectionMethods) {
    if (detectionMethods.length === 0) return 0;
    
    let confidence = 0;
    detectionMethods.forEach(method => {
      if (method.confidence) {
        confidence += method.confidence;
      } else {
        confidence += 50; // Base confidence if not specified
      }
    });
    
    return Math.min(100, Math.round(confidence / detectionMethods.length));
  }

  /**
   * Generate alert with TWO conditions:
   * 1. Between consecutive alerts: variance must be >= 20%
   * 2. Between current and alert-before-last: variance must be >= 10%
   */
  _generateAlertIfNeeded(combinedResult, features) {
    const currentProb = combinedResult.overallProbability;
    
    // Condition 1: Must differ from last alert by at least 20%
    const diffFromLastAlert = Math.abs(currentProb - this.lastAlertProbability);
    if (diffFromLastAlert < 20) {
      return null; // Not enough variance from last alert
    }
    
    // Condition 2: Must differ from alert-before-last by at least 10%
    const diffFromSecondLastAlert = Math.abs(currentProb - this.secondLastAlertProbability);
    if (diffFromSecondLastAlert < 10) {
      return null; // Not enough variance from alert before last
    }

    // Both conditions met - create alert
    this.secondLastAlertProbability = this.lastAlertProbability; // Shift last to second-last
    this.lastAlertProbability = currentProb;
    this.lastAlertSeverity = combinedResult.severityLevel;

    const alert = {
      id: generateId(),
      timestamp: getCurrentTimestamp(),
      severity: combinedResult.severityLevel,
      probability: currentProb,
      detection: combinedResult,
      location: this._getLocationString(features),
      message: this._generateAlertMessage(combinedResult),
      readings: {
        pressure: features.pressure,
        flow: features.flow,
        leak_status_sensor: features.leak_status,
        valve_state: features.valve_state
      },
      recommendedActions: this._getRecommendedActions(combinedResult),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      acknowledgeNotes: null,
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      resolveNotes: null,
      notificationsSent: []
    };

    this.alerts.push(alert);
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    const emoji = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      MINOR: '🟢',
      NORMAL: '✅'
    };

    console.log(`[DUAL_AI_ENGINE] ${emoji[alert.severity] || '⚠️'} ALERT: ${alert.severity} (${alert.probability}%): ${alert.message}`);

    return alert;
  }

  /**
   * Calculate severity
   */
  _calculateSeverity(probability) {
    if (probability >= 80) return 'CRITICAL';
    if (probability >= 65) return 'HIGH';
    if (probability >= 50) return 'MEDIUM';
    if (probability >= 35) return 'MINOR';
    return 'NORMAL';
  }

  /**
   * Generate alert message
   */
  _generateAlertMessage(result) {
    const p = result.overallProbability;
    if (p >= 80) return 'CRITICAL: Immediate leak action required. Severe anomaly detected.';
    if (p >= 65) return 'HIGH: Strong leak indication. Urgent inspection needed.';
    if (p >= 50) return 'MEDIUM: Possible leak detected. Schedule inspection soon.';
    if (p >= 35) return 'LOW: Minor anomaly detected. Monitor system closely.';
    return 'NORMAL: System operating normally.';
  }

  /**
   * Get recommended actions
   */
  _getRecommendedActions(result) {
    const actions = [];
    const p = result.overallProbability;

    if (p >= 80) {
      actions.push('EMERGENCY: Isolate affected section immediately');
      actions.push('EMERGENCY: Call maintenance team urgently');
      actions.push('EMERGENCY: Prepare for emergency shutdown');
    } else if (p >= 65) {
      actions.push('URGENT: Schedule inspection within 1-2 hours');
      actions.push('URGENT: Monitor pressure and flow closely');
      actions.push('URGENT: Alert maintenance team');
    } else if (p >= 50) {
      actions.push('ROUTINE: Schedule inspection within 24 hours');
      actions.push('ROUTINE: Increase monitoring frequency');
      actions.push('ROUTINE: Check system logs for anomalies');
    } else if (p >= 35) {
      actions.push('ADVISORY: Schedule inspection within 3-5 days');
      actions.push('ADVISORY: Continue normal monitoring');
    }

    if (result.timeToFailure && result.timeToFailure < 48) {
      actions.push(`PREDICTIVE: Estimated time to failure: ${result.timeToFailure} hours`);
    }

    return actions;
  }

  /**
   * Get location string
   */
  _getLocationString(features) {
    const locations = [
      'Zone A - Main Distribution',
      'Zone B - East Wing',
      'Zone C - West Wing',
      'Basement Level 1',
      'Main Valve Chamber',
      'Secondary Line',
      'Pressure Regulator Station'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      ruleBasedReady: this.systemStatus.ruleBasedReady,
      dualAIReady: this.systemStatus.dualAIReady,
      preprocessorReady: this.systemStatus.preprocessorReady,
      maintenanceReady: this.systemStatus.maintenanceReady,
      dualAIStatus: this.dualAI.getStatus(),
      historySize: this.detectionHistory.length,
      alertCount: this.alerts.length
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10) {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get recent detections
   */
  getRecentDetections(limit = 100) {
    return this.detectionHistory.slice(-limit).reverse().map(item => ({
      id: item.id,
      timestamp: item.timestamp,
      readings: {
        pressure: item.features?.pressure,
        flow: item.features?.flow,
        temperature: item.features?.temperature,
        conductivity: item.features?.conductivity
      },
      detection: {
        overallLeakDetected: item.combinedResult?.overallLeakDetected || false,
        overallProbability: item.combinedResult?.overallProbability || 0,
        severityLevel: item.combinedResult?.severityLevel || 'NORMAL',
        detectionMethods: item.combinedResult?.detectionMethods || []
      },
      alert: item.alert || null
    }));
  }

  /**
   * Analyze historical patterns
   */
  analyzeHistoricalPatterns() {
    if (this.detectionHistory.length < 10) {
      return null;
    }

    const recent = this.detectionHistory.slice(-100);
    const probabilities = recent.map(d => d.detection?.overallProbability || 0);
    const avgProb = probabilities.reduce((a, b) => a + b, 0) / probabilities.length;
    const maxProb = Math.max(...probabilities);
    const minProb = Math.min(...probabilities);

    return {
      totalDetections: this.detectionHistory.length,
      recentDetections: recent.length,
      averageProbability: Math.round(avgProb),
      maxProbability: Math.round(maxProb),
      minProbability: Math.round(minProb),
      alertCount: this.alerts.length,
      recentAlerts: this.alerts.slice(-10).map(a => ({
        severity: a.severity,
        probability: a.probability,
        timestamp: a.timestamp
      }))
    };
  }

  /**
   * Get comprehensive report
   */
  getComprehensiveReport() {
    const status = this.getSystemStatus();
    const patterns = this.analyzeHistoricalPatterns();
    
    return {
      timestamp: Date.now(),
      systemStatus: status,
      patterns: patterns,
      recentAlerts: this.getRecentAlerts(20),
      recentDetections: this.getRecentDetections(50)
    };
  }

  /**
   * Reset the detection engine
   */
  reset() {
    this.detectionHistory = [];
    this.alerts = [];
    if (this.dualAI && this.dualAI.reset) {
      this.dualAI.reset();
    }
    if (this.ruleBased && this.ruleBased.reset) {
      this.ruleBased.reset();
    }
  }
}

// Singleton instance
const dualAIEngine = new DualAIIntegratedEngine();

module.exports = {
  dualAIEngine,
  DualAIIntegratedEngine
};

/**
 * Rule-Based Leak Detection System
 * Baseline detection system using engineered features and threshold-based rules
 * Provides leak probability scores and severity levels with detailed reasoning
 */

const { getCurrentTimestamp } = require('./helpers');

/**
 * Detection thresholds and rules configuration
 */
const CONFIG = {
  CRITICAL_LEAK: {
    name: 'CRITICAL_LEAK',
    description: 'Sudden pressure drop >15% in <60 seconds',
    pressure_drop_threshold: 0.15, // 15%
    time_window: 60, // seconds
    base_probability: 85, // base leak probability %
    severity: 'CRITICAL'
  },

  MINOR_LEAK: {
    name: 'MINOR_LEAK',
    description: 'Gradual pressure drop 5-15% over 5 minutes',
    pressure_drop_min: 0.05, // 5%
    pressure_drop_max: 0.15, // 15%
    time_window: 300, // 5 minutes in seconds
    base_probability: 50,
    severity: 'MINOR'
  },

  FLOW_PRESSURE_MISMATCH: {
    name: 'FLOW_PRESSURE_MISMATCH',
    description: 'Flow increases >25% while pressure decreases',
    flow_increase_threshold: 0.25, // 25%
    pressure_decrease_threshold: 0.02, // 2% (any decrease)
    base_probability: 70,
    severity: 'HIGH'
  },

  RATIO_ANOMALY: {
    name: 'RATIO_ANOMALY',
    description: 'Pressure-to-flow ratio deviates >30% from baseline',
    ratio_deviation_threshold: 0.30, // 30%
    base_probability: 45,
    severity: 'MEDIUM'
  },

  SPIKE_ANOMALY: {
    name: 'SPIKE_ANOMALY',
    description: 'Sudden pressure or flow spike detected',
    base_probability: 35,
    severity: 'LOW'
  }
};

const SEVERITY_LEVELS = {
  CRITICAL: { level: 4, color: '🔴' },
  HIGH: { level: 3, color: '🟠' },
  MEDIUM: { level: 2, color: '🟡' },
  MINOR: { level: 1, color: '🟢' },
  NORMAL: { level: 0, color: '✅' }
};

class RuleBasedLeakDetector {
  constructor() {
    this.sensorHistory = []; // Keep recent readings for rule evaluation
    this.baselineMetrics = null;
    this.detectionResults = [];
    this.maxHistorySize = 200; // ~3 minutes at 1 reading/second

    console.log('[LEAK_DETECTOR] Rule-Based Leak Detection System initialized');
    console.log(`[LEAK_DETECTOR] Available rules: ${Object.keys(CONFIG).length}`);
    console.log('[LEAK_DETECTOR] Rules:');
    Object.entries(CONFIG).forEach(([key, rule]) => {
      if (rule.description) {
        console.log(`  • ${key}: ${rule.description}`);
      }
    });
  }

  /**
   * Set baseline metrics for comparison (pressure-to-flow ratio baseline)
   */
  setBaseline(pressure, flow) {
    if (flow > 0.1) {
      this.baselineMetrics = {
        pressure,
        flow,
        ratio: pressure / flow,
        timestamp: getCurrentTimestamp()
      };

      console.log('[LEAK_DETECTOR] ✓ Baseline metrics set');
      console.log(`  Baseline Pressure: ${pressure} PSI`);
      console.log(`  Baseline Flow: ${flow} L/min`);
      console.log(`  Baseline Ratio: ${(pressure / flow).toFixed(4)}`);
    }
  }

  /**
   * Add reading to history for rule evaluation
   */
  _addToHistory(reading) {
    this.sensorHistory.push(reading);

    // Maintain circular buffer
    if (this.sensorHistory.length > this.maxHistorySize) {
      this.sensorHistory.shift();
    }
  }

  /**
   * Rule 1: Detect critical leak (sudden pressure drop >15% in <60 seconds)
   */
  _checkCriticalLeak(currentReading) {
    const rule = CONFIG.CRITICAL_LEAK;
    const windowMs = rule.time_window * 1000;
    const now = currentReading.timestamp;
    const windowStart = now - windowMs;

    // Find readings within the window
    const windowReadings = this.sensorHistory.filter(
      r => r.timestamp >= windowStart && r.timestamp < now
    );

    if (windowReadings.length < 2) {
      return { triggered: false, details: 'Insufficient historical data' };
    }

    // Get the earliest reading in the window
    const earliestReading = windowReadings[0];
    const pressureDrop = earliestReading.pressure - currentReading.pressure;
    const pressureDropPercent = Math.abs(pressureDrop / earliestReading.pressure);

    const triggered = pressureDropPercent > rule.pressure_drop_threshold && pressureDrop > 0;

    return {
      triggered,
      details: {
        rule: rule.name,
        description: rule.description,
        windowSeconds: rule.time_window,
        pressureBefore: earliestReading.pressure,
        pressureNow: currentReading.pressure,
        pressureDrop: Math.round(pressureDrop * 100) / 100,
        pressureDropPercent: Math.round(pressureDropPercent * 10000) / 100 + '%',
        threshold: rule.pressure_drop_threshold * 100 + '%',
        baseProbability: rule.base_probability,
        severity: rule.severity
      }
    };
  }

  /**
   * Rule 2: Detect minor leak (gradual pressure drop 5-15% over 5 minutes)
   */
  _checkMinorLeak(currentReading) {
    const rule = CONFIG.MINOR_LEAK;
    const windowMs = rule.time_window * 1000;
    const now = currentReading.timestamp;
    const windowStart = now - windowMs;

    // Find readings within the window
    const windowReadings = this.sensorHistory.filter(
      r => r.timestamp >= windowStart && r.timestamp < now
    );

    if (windowReadings.length < 2) {
      return { triggered: false, details: 'Insufficient historical data' };
    }

    // Get the oldest reading in the window
    const oldestReading = windowReadings[0];
    const pressureDrop = oldestReading.pressure - currentReading.pressure;
    const pressureDropPercent = Math.abs(pressureDrop / oldestReading.pressure);

    const triggered =
      pressureDropPercent >= rule.pressure_drop_min &&
      pressureDropPercent <= rule.pressure_drop_max &&
      pressureDrop > 0;

    return {
      triggered,
      details: {
        rule: rule.name,
        description: rule.description,
        windowMinutes: rule.time_window / 60,
        pressureBefore: oldestReading.pressure,
        pressureNow: currentReading.pressure,
        pressureDrop: Math.round(pressureDrop * 100) / 100,
        pressureDropPercent: Math.round(pressureDropPercent * 10000) / 100 + '%',
        thresholdRange: `${rule.pressure_drop_min * 100}% - ${rule.pressure_drop_max * 100}%`,
        baseProbability: rule.base_probability,
        severity: rule.severity
      }
    };
  }

  /**
   * Rule 3: Detect flow-pressure mismatch (flow up >25% while pressure down)
   */
  _checkFlowPressureMismatch(currentReading) {
    const rule = CONFIG.FLOW_PRESSURE_MISMATCH;

    if (this.sensorHistory.length < 1) {
      return { triggered: false, details: 'Insufficient historical data' };
    }

    const previousReading = this.sensorHistory[this.sensorHistory.length - 1];

    const flowIncrease = currentReading.flow - previousReading.flow;
    const flowIncreasePercent = Math.abs(flowIncrease / previousReading.flow);

    const pressureDecrease = previousReading.pressure - currentReading.pressure;
    const pressureDecreasePercent = pressureDecrease / previousReading.pressure;

    const triggered =
      flowIncreasePercent > rule.flow_increase_threshold &&
      pressureDecreasePercent > rule.pressure_decrease_threshold;

    return {
      triggered,
      details: {
        rule: rule.name,
        description: rule.description,
        flowBefore: previousReading.flow,
        flowNow: currentReading.flow,
        flowIncrease: Math.round(flowIncrease * 100) / 100,
        flowIncreasePercent: Math.round(flowIncreasePercent * 10000) / 100 + '%',
        flowThreshold: rule.flow_increase_threshold * 100 + '%',
        pressureBefore: previousReading.pressure,
        pressureNow: currentReading.pressure,
        pressureDecrease: Math.round(pressureDecrease * 100) / 100,
        pressureDecreasePercent: Math.round(pressureDecreasePercent * 10000) / 100 + '%',
        baseProbability: rule.base_probability,
        severity: rule.severity
      }
    };
  }

  /**
   * Rule 4: Detect ratio anomaly (P/F ratio deviates >30% from baseline)
   */
  _checkRatioAnomaly(currentReading) {
    const rule = CONFIG.RATIO_ANOMALY;

    if (!this.baselineMetrics) {
      return { triggered: false, details: 'No baseline established' };
    }

    if (currentReading.flow < 0.1) {
      return { triggered: false, details: 'Flow too low for meaningful ratio' };
    }

    const currentRatio = currentReading.pressure / currentReading.flow;
    const baselineRatio = this.baselineMetrics.ratio;
    const ratioDifference = Math.abs(currentRatio - baselineRatio) / baselineRatio;

    const triggered = ratioDifference > rule.ratio_deviation_threshold;

    return {
      triggered,
      details: {
        rule: rule.name,
        description: rule.description,
        baselineRatio: Math.round(baselineRatio * 10000) / 10000,
        currentRatio: Math.round(currentRatio * 10000) / 10000,
        deviation: Math.round(ratioDifference * 10000) / 100 + '%',
        threshold: rule.ratio_deviation_threshold * 100 + '%',
        baseProbability: rule.base_probability,
        severity: rule.severity
      }
    };
  }

  /**
   * Rule 5: Detect spike anomaly (pressure or flow spike)
   */
  _checkSpikeAnomaly(currentReading) {
    const rule = CONFIG.SPIKE_ANOMALY;

    const triggered =
      currentReading.pressure_spike_detected ||
      currentReading.flow_spike_detected;

    return {
      triggered,
      details: {
        rule: rule.name,
        description: rule.description,
        pressureSpikeDetected: currentReading.pressure_spike_detected,
        flowSpikeDetected: currentReading.flow_spike_detected,
        baseProbability: rule.base_probability,
        severity: rule.severity
      }
    };
  }

  /**
   * Calculate final leak probability based on triggered rules
   */
  _calculateLeakProbability(ruleResults) {
    let totalProbability = 0;
    let ruleCount = 0;
    const triggeredRules = [];

    Object.entries(ruleResults).forEach(([ruleKey, result]) => {
      if (result.triggered) {
        const rule = CONFIG[ruleKey];
        totalProbability += rule.base_probability;
        ruleCount++;
        triggeredRules.push({
          rule: rule.name,
          probability: rule.base_probability,
          severity: rule.severity
        });
      }
    });

    // If multiple rules triggered, increase probability (compounding effect)
    if (ruleCount > 1) {
      // Maximum boost of 20% for multiple rule triggers
      const boost = Math.min(20, ruleCount * 5);
      totalProbability = Math.min(100, totalProbability + boost);
    }

    // If no rules triggered, base probability is 0
    if (ruleCount === 0) {
      totalProbability = 0;
    } else {
      // Cap at 100%
      totalProbability = Math.min(100, totalProbability);
    }

    return {
      probability: Math.round(totalProbability),
      triggeredRuleCount: ruleCount,
      triggeredRules
    };
  }

  /**
   * Determine severity level based on probability and rules
   */
  _determineSeverity(ruleResults, probability) {
    // Check for critical rules first
    if (ruleResults.CRITICAL_LEAK.triggered) {
      return SEVERITY_LEVELS.CRITICAL.level;
    }

    if (ruleResults.FLOW_PRESSURE_MISMATCH.triggered) {
      return SEVERITY_LEVELS.HIGH.level;
    }

    if (ruleResults.RATIO_ANOMALY.triggered || ruleResults.MINOR_LEAK.triggered) {
      return SEVERITY_LEVELS.MEDIUM.level;
    }

    if (ruleResults.SPIKE_ANOMALY.triggered) {
      return SEVERITY_LEVELS.LOW.level;
    }

    // Fallback to probability-based severity
    if (probability >= 70) return SEVERITY_LEVELS.CRITICAL.level;
    if (probability >= 50) return SEVERITY_LEVELS.HIGH.level;
    if (probability >= 30) return SEVERITY_LEVELS.MEDIUM.level;
    if (probability > 0) return SEVERITY_LEVELS.LOW.level;

    return SEVERITY_LEVELS.NORMAL.level;
  }

  /**
   * Get severity label from level
   */
  _getSeverityLabel(level) {
    return Object.entries(SEVERITY_LEVELS).find(([_, v]) => v.level === level)[0];
  }

  /**
   * Evaluate all rules and return detection result
   */
  evaluate(features) {
    // Add to history
    this._addToHistory(features);

    // Evaluate all rules
    const ruleResults = {
      CRITICAL_LEAK: this._checkCriticalLeak(features),
      MINOR_LEAK: this._checkMinorLeak(features),
      FLOW_PRESSURE_MISMATCH: this._checkFlowPressureMismatch(features),
      RATIO_ANOMALY: this._checkRatioAnomaly(features),
      SPIKE_ANOMALY: this._checkSpikeAnomaly(features)
    };

    // Calculate leak probability
    const probabilityInfo = this._calculateLeakProbability(ruleResults);

    // Determine severity
    const severityLevel = this._determineSeverity(ruleResults, probabilityInfo.probability);
    const severityLabel = this._getSeverityLabel(severityLevel);

    const result = {
      timestamp: features.timestamp,
      leak_probability: probabilityInfo.probability,
      severity: severityLabel,
      severity_level: severityLevel,
      severity_icon: SEVERITY_LEVELS[severityLabel].color,
      is_leak_detected: probabilityInfo.probability >= 50,
      triggered_rules: probabilityInfo.triggeredRules,
      triggered_count: probabilityInfo.triggeredRuleCount,
      current_readings: {
        pressure: features.pressure,
        flow: features.flow,
        leak_status: features.leak_status
      },
      rule_details: {
        critical_leak: ruleResults.CRITICAL_LEAK.details,
        minor_leak: ruleResults.MINOR_LEAK.details,
        flow_pressure_mismatch: ruleResults.FLOW_PRESSURE_MISMATCH.details,
        ratio_anomaly: ruleResults.RATIO_ANOMALY.details,
        spike_anomaly: ruleResults.SPIKE_ANOMALY.details
      }
    };

    // Store result
    this.detectionResults.push(result);
    if (this.detectionResults.length > 1000) {
      this.detectionResults.shift();
    }

    return result;
  }

  /**
   * Log detection result with detailed reasoning
   */
  logDetectionResult(result) {
    const timestamp = new Date(result.timestamp).toISOString();
    const probabilityBar = '█'.repeat(Math.round(result.leak_probability / 5)) +
      '░'.repeat(20 - Math.round(result.leak_probability / 5));

    console.log(`\n${'═'.repeat(80)}`);
    console.log(
      `[LEAK_DETECTION] ${result.severity_icon} ${result.severity} - ${timestamp}`
    );
    console.log(`${'═'.repeat(80)}`);

    console.log(`[PROBABILITY SCORE]`);
    console.log(`  ${result.leak_probability}% ${probabilityBar}`);
    console.log(`  Status: ${result.is_leak_detected ? '⚠️  LEAK DETECTED' : '✓ No Leak'}`);

    console.log(`\n[CURRENT READINGS]`);
    console.log(`  Pressure: ${result.current_readings.pressure} PSI`);
    console.log(`  Flow: ${result.current_readings.flow} L/min`);
    console.log(`  Sensor Leak Status: ${result.current_readings.leak_status}`);

    if (result.triggered_rules.length > 0) {
      console.log(`\n[TRIGGERED RULES] (${result.triggered_count})`);
      result.triggered_rules.forEach((rule, idx) => {
        console.log(`  ${idx + 1}. ${rule.rule} (P: ${rule.probability}%, S: ${rule.severity})`);
      });

      console.log(`\n[DETAILED RULE ANALYSIS]`);

      if (result.triggered_rules.some(r => r.rule === 'CRITICAL_LEAK')) {
        const details = result.rule_details.critical_leak;
        console.log(`  🔴 CRITICAL LEAK:`);
        console.log(`     ${details.description}`);
        console.log(`     Pressure before: ${details.pressureBefore} → now: ${details.pressureNow} PSI`);
        console.log(`     Drop: ${details.pressureDrop} PSI (${details.pressureDropPercent})`);
        console.log(`     Threshold: ${details.threshold} in ${details.windowSeconds}s`);
      }

      if (result.triggered_rules.some(r => r.rule === 'MINOR_LEAK')) {
        const details = result.rule_details.minor_leak;
        console.log(`  🟡 MINOR LEAK:`);
        console.log(`     ${details.description}`);
        console.log(`     Pressure before: ${details.pressureBefore} → now: ${details.pressureNow} PSI`);
        console.log(`     Drop: ${details.pressureDrop} PSI (${details.pressureDropPercent})`);
        console.log(`     Threshold range: ${details.thresholdRange} over ${details.windowMinutes} min`);
      }

      if (result.triggered_rules.some(r => r.rule === 'FLOW_PRESSURE_MISMATCH')) {
        const details = result.rule_details.flow_pressure_mismatch;
        console.log(`  🟠 FLOW-PRESSURE MISMATCH:`);
        console.log(`     ${details.description}`);
        console.log(`     Flow: ${details.flowBefore} → ${details.flowNow} L/min (${details.flowIncreasePercent})`);
        console.log(`     Pressure: ${details.pressureBefore} → ${details.pressureNow} PSI (${details.pressureDecreasePercent})`);
        console.log(`     Threshold: ${details.flowThreshold} flow increase while pressure drops`);
      }

      if (result.triggered_rules.some(r => r.rule === 'RATIO_ANOMALY')) {
        const details = result.rule_details.ratio_anomaly;
        console.log(`  🟢 RATIO ANOMALY:`);
        console.log(`     ${details.description}`);
        console.log(`     Baseline ratio: ${details.baselineRatio}`);
        console.log(`     Current ratio: ${details.currentRatio}`);
        console.log(`     Deviation: ${details.deviation} (threshold: ${details.threshold})`);
      }

      if (result.triggered_rules.some(r => r.rule === 'SPIKE_ANOMALY')) {
        const details = result.rule_details.spike_anomaly;
        console.log(`  🟡 SPIKE ANOMALY:`);
        console.log(`     ${details.description}`);
        if (details.pressureSpikeDetected) console.log(`     Pressure spike detected`);
        if (details.flowSpikeDetected) console.log(`     Flow spike detected`);
      }
    } else {
      console.log(`\n[STATUS]`);
      console.log(`  No leak detection rules triggered`);
      console.log(`  System operating normally`);
    }

    console.log(`${'═'.repeat(80)}\n`);
  }

  /**
   * Get detection statistics
   */
  getStatistics() {
    if (this.detectionResults.length === 0) {
      return null;
    }

    const results = this.detectionResults;
    const leakDetections = results.filter(r => r.is_leak_detected);

    return {
      totalEvaluations: results.length,
      leakDetections: leakDetections.length,
      leakDetectionRate: ((leakDetections.length / results.length) * 100).toFixed(2) + '%',
      avgProbability: Math.round(results.reduce((sum, r) => sum + r.leak_probability, 0) / results.length),
      maxProbability: Math.max(...results.map(r => r.leak_probability)),
      minProbability: Math.min(...results.map(r => r.leak_probability)),
      criticalsDetected: results.filter(r => r.severity === 'CRITICAL').length,
      highsDetected: results.filter(r => r.severity === 'HIGH').length,
      mediumsDetected: results.filter(r => r.severity === 'MEDIUM').length,
      lowsDetected: results.filter(r => r.severity === 'LOW').length
    };
  }

  /**
   * Log detection statistics
   */
  logStatistics() {
    const stats = this.getStatistics();

    if (!stats) {
      console.log('[STATISTICS] No evaluations performed yet');
      return;
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log('[LEAK DETECTION STATISTICS]');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Total Evaluations: ${stats.totalEvaluations}`);
    console.log(`Leak Detections: ${stats.leakDetections}`);
    console.log(`Detection Rate: ${stats.leakDetectionRate}`);
    console.log(`Average Probability: ${stats.avgProbability}%`);
    console.log(`Probability Range: ${stats.minProbability}% - ${stats.maxProbability}%`);
    console.log(`\nSeverity Distribution:`);
    console.log(`  🔴 Critical: ${stats.criticalsDetected}`);
    console.log(`  🟠 High: ${stats.highsDetected}`);
    console.log(`  🟡 Medium: ${stats.mediumsDetected}`);
    console.log(`  🟢 Low: ${stats.lowsDetected}`);
    console.log(`${'═'.repeat(80)}\n`);
  }

  /**
   * Reset detector state
   */
  reset() {
    this.sensorHistory = [];
    this.detectionResults = [];
    console.log('[LEAK_DETECTOR] Detector reset');
  }

  /**
   * Export recent results
   */
  exportResults(count = null) {
    const results = count ? this.detectionResults.slice(-count) : this.detectionResults;
    return {
      exportDate: new Date().toISOString(),
      count: results.length,
      results
    };
  }
}

// Create singleton instance
const leakDetector = new RuleBasedLeakDetector();

module.exports = {
  RuleBasedLeakDetector,
  leakDetector,
  CONFIG,
  SEVERITY_LEVELS
};

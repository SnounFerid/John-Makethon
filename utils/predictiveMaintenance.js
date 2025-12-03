/**
 * Predictive Maintenance Module
 * Analyzes historical trends, predicts maintenance needs, and identifies risk areas
 * Includes pipe metadata, degradation patterns, and leak location prediction
 */

const { getCurrentTimestamp, generateId } = require('./helpers');

/**
 * Pipe segment metadata
 */
class PipeSegment {
  constructor(config) {
    this.id = config.id || generateId();
    this.name = config.name || `Pipe-${this.id.substring(0, 8)}`;
    this.material = config.material || 'PVC'; // PVC, Cast Iron, Copper, PEX
    this.diameter = config.diameter || 25; // mm
    this.length = config.length || 100; // meters
    this.installationDate = config.installationDate || Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year ago
    this.location = config.location || 'Unknown';
    this.pressureRating = config.pressureRating || 80; // PSI
    this.lastInspectionDate = config.lastInspectionDate || Date.now();
    this.previousLeakCount = config.previousLeakCount || 0;
    this.historicalData = [];

    console.log(`[PIPE_SEGMENT] Created: ${this.name}`);
    console.log(`  Material: ${this.material}, Diameter: ${this.diameter}mm, Length: ${this.length}m`);
    console.log(`  Age: ${this.getAgeYears().toFixed(2)} years`);
    console.log(`  Previous Leaks: ${this.previousLeakCount}`);
  }

  /**
   * Get pipe age in years
   */
  getAgeYears() {
    return (Date.now() - this.installationDate) / (365.25 * 24 * 60 * 60 * 1000);
  }

  /**
   * Add historical reading to pipe segment
   */
  addReading(reading) {
    this.historicalData.push({
      timestamp: reading.timestamp || getCurrentTimestamp(),
      pressure: reading.pressure,
      flow: reading.flow,
      temperature: reading.temperature || 20,
      leak_detected: reading.leak_detected || false,
      anomaly_score: reading.anomaly_score || 0
    });

    // Keep last 1000 readings
    if (this.historicalData.length > 1000) {
      this.historicalData.shift();
    }
  }

  /**
   * Get material degradation factor
   */
  getMaterialDegradationFactor() {
    const factors = {
      'Cast Iron': 1.5, // High degradation
      'Galvanized Steel': 1.3,
      'Copper': 0.6, // Low degradation
      'PVC': 0.4, // Very low degradation
      'PEX': 0.3 // Excellent resistance
    };

    return factors[this.material] || 1.0;
  }

  /**
   * Get diameter risk factor (smaller diameter = higher risk)
   */
  getDiameterRiskFactor() {
    if (this.diameter <= 15) return 1.4; // High risk
    if (this.diameter <= 25) return 1.2;
    if (this.diameter <= 50) return 1.0;
    return 0.8; // Low risk for larger diameter
  }

  /**
   * Get installation era risk factor
   */
  getInstallationEraRiskFactor() {
    const ageYears = this.getAgeYears();

    if (ageYears > 50) return 1.6; // Very high risk
    if (ageYears > 40) return 1.5;
    if (ageYears > 30) return 1.4;
    if (ageYears > 20) return 1.3;
    if (ageYears > 10) return 1.1;
    if (ageYears > 5) return 1.0;
    return 0.8; // Low risk for newer pipes
  }

  /**
   * Get previous leak risk factor
   */
  getPreviousLeakRiskFactor() {
    return 1 + this.previousLeakCount * 0.3; // Each previous leak increases risk by 30%
  }
}

/**
 * Trend Analyzer for time-series data
 */
class TrendAnalyzer {
  constructor(pipeSegment) {
    this.pipe = pipeSegment;
    this.trendResults = {};

    console.log(`[TREND_ANALYZER] Initialized for ${pipeSegment.name}`);
  }

  /**
   * Calculate linear trend (slope) of values over time
   */
  calculateTrend(values, timePoints) {
    if (values.length < 2) {
      return 0;
    }

    const n = values.length;
    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + timePoints[i] * y, 0);
    const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }

  /**
   * Calculate moving average
   */
  calculateMovingAverage(values, windowSize) {
    const result = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
      const window = values.slice(start, end);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      result.push(avg);
    }

    return result;
  }

  /**
   * Detect degradation patterns
   */
  analyzeDegradation() {
    if (this.pipe.historicalData.length < 10) {
      console.warn(`[TREND_ANALYZER] Insufficient data for ${this.pipe.name} (${this.pipe.historicalData.length} readings)`);
      return null;
    }

    const data = this.pipe.historicalData;
    const pressureValues = data.map(d => d.pressure);
    const timePoints = data.map((d, i) => i); // Sequential indices

    // Calculate trends
    const pressureTrend = this.calculateTrend(pressureValues, timePoints);
    const flowValues = data.map(d => d.flow);
    const flowTrend = this.calculateTrend(flowValues, timePoints);

    // Calculate moving averages
    const pressureMA = this.calculateMovingAverage(pressureValues, 5);
    const flowMA = this.calculateMovingAverage(flowValues, 5);

    // Calculate volatility (standard deviation)
    const avgPressure = pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length;
    const pressureVariance =
      pressureValues.reduce((sum, val) => sum + Math.pow(val - avgPressure, 2), 0) /
      pressureValues.length;
    const pressureVolatility = Math.sqrt(pressureVariance);

    const avgFlow = flowValues.reduce((a, b) => a + b, 0) / flowValues.length;
    const flowVariance =
      flowValues.reduce((sum, val) => sum + Math.pow(val - avgFlow, 2), 0) /
      flowValues.length;
    const flowVolatility = Math.sqrt(flowVariance);

    // Count anomalies
    const anomalyCount = data.filter(d => d.anomaly_score > 0.5).length;
    const leakCount = data.filter(d => d.leak_detected).length;

    return {
      pressureTrend,
      flowTrend,
      pressureVolatility,
      flowVolatility,
      anomalyCount,
      leakCount,
      avgPressure,
      avgFlow,
      pressureMA,
      flowMA
    };
  }

  /**
   * Predict future values using linear regression
   */
  predictFutureValues(stepsAhead = 10) {
    if (this.pipe.historicalData.length < 2) {
      return null;
    }

    const degradation = this.analyzeDegradation();
    if (!degradation) return null;

    const lastIndex = this.pipe.historicalData.length - 1;
    const lastPressure = this.pipe.historicalData[lastIndex].pressure;
    const lastFlow = this.pipe.historicalData[lastIndex].flow;

    const predictions = [];

    for (let i = 1; i <= stepsAhead; i++) {
      predictions.push({
        step: i,
        predictedPressure: lastPressure + degradation.pressureTrend * i,
        predictedFlow: lastFlow + degradation.flowTrend * i,
        pressureChange: degradation.pressureTrend * i,
        flowChange: degradation.flowTrend * i
      });
    }

    return predictions;
  }
}

/**
 * Risk Scorer for maintenance assessment
 */
class RiskScorer {
  /**
   * Calculate composite risk score (0-100)
   */
  static calculateRiskScore(pipe, degradation) {
    if (!degradation) {
      return 10; // Baseline low risk without data
    }

    let riskScore = 0;

    // Age-based risk (0-30 points)
    const ageYears = pipe.getAgeYears();
    const ageRisk = Math.min(30, (ageYears / 50) * 30);
    riskScore += ageRisk;

    // Material degradation (0-20 points)
    const materialFactor = pipe.getMaterialDegradationFactor();
    const materialRisk = materialFactor * 15;
    riskScore += Math.min(20, materialRisk);

    // Diameter risk (0-15 points)
    const diameterFactor = pipe.getDiameterRiskFactor();
    const diameterRisk = (2 - diameterFactor) * 10;
    riskScore += diameterRisk;

    // Pressure trend risk (0-20 points)
    if (degradation.pressureTrend < -0.1) {
      riskScore += Math.min(20, Math.abs(degradation.pressureTrend) * 50);
    }

    // Volatility risk (0-10 points)
    const volatilityRisk = Math.min(10, (degradation.pressureVolatility / 5) * 10);
    riskScore += volatilityRisk;

    // Anomaly frequency (0-15 points)
    const totalReadings = Math.max(1, degradation.anomalyCount + degradation.leakCount);
    const anomalyFrequency = (degradation.anomalyCount / Math.max(1, pipe.historicalData.length)) * 100;
    const anomalyRisk = Math.min(15, (anomalyFrequency / 10) * 15);
    riskScore += anomalyRisk;

    // Previous leak factor (0-10 points)
    const leakRisk = Math.min(10, pipe.previousLeakCount * 3);
    riskScore += leakRisk;

    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * Determine risk level from score
   */
  static getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get risk level icon
   */
  static getRiskIcon(level) {
    const icons = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢',
      MINIMAL: '✅'
    };
    return icons[level] || '❓';
  }
}

/**
 * Leak Location Predictor
 */
class LeakLocationPredictor {
  /**
   * Predict probable leak locations based on pressure gradient
   */
  static predictLeakLocations(pipe, degradation) {
    if (!degradation || pipe.historicalData.length < 5) {
      return null;
    }

    const predictions = [];
    const segmentCount = 5; // Divide pipe into 5 segments

    // Calculate pressure gradient
    const recentReadings = pipe.historicalData.slice(-10);
    const avgPressureDrop = recentReadings.reduce((sum, r) => sum + r.pressure, 0) / recentReadings.length;

    // Identify high-risk segments based on degradation patterns
    for (let i = 1; i <= segmentCount; i++) {
      const locationPercent = (i / segmentCount) * 100;
      const location = (pipe.length / segmentCount) * i;

      // Risk increases with distance (corrosion tends to accumulate)
      const distanceRiskFactor = i / segmentCount;

      // Calculate segment risk
      let segmentRisk = 0;
      segmentRisk += degradation.pressureVolatility * 10 * distanceRiskFactor;
      segmentRisk += pipe.getPreviousLeakRiskFactor() * 15;

      // Age factor
      const ageYears = pipe.getAgeYears();
      if (ageYears > 30) {
        segmentRisk += (ageYears - 30) * distanceRiskFactor;
      }

      // Material factor
      const materialFactor = pipe.getMaterialDegradationFactor();
      segmentRisk += materialFactor * 20 * distanceRiskFactor;

      segmentRisk = Math.min(100, segmentRisk);

      predictions.push({
        segmentNumber: i,
        locationPercent: locationPercent,
        locationMeters: location,
        riskScore: Math.round(segmentRisk),
        likelihood: segmentRisk > 50 ? 'HIGH' : segmentRisk > 30 ? 'MEDIUM' : 'LOW',
        depth: 'Unknown' // Would need actual location data
      });
    }

    // Sort by risk score
    predictions.sort((a, b) => b.riskScore - a.riskScore);

    return predictions;
  }
}

/**
 * Maintenance Recommender
 */
class MaintenanceRecommender {
  /**
   * Generate maintenance recommendations
   */
  static generateRecommendations(pipe, riskScore, riskLevel, degradation, leakLocations) {
    const recommendations = [];
    const priority = riskLevel;

    console.log(`[MAINTENANCE_RECOMMENDER] Generating recommendations for ${pipe.name}`);
    console.log(`  Risk Level: ${riskLevel} (Score: ${riskScore})`);

    // Age-based recommendations
    const ageYears = pipe.getAgeYears();
    if (ageYears > 40) {
      recommendations.push({
        type: 'REPLACEMENT',
        urgency: 'CRITICAL',
        description: `Pipe exceeds 40 years old (${ageYears.toFixed(1)} years). Full replacement recommended.`,
        estimatedCost: 'High',
        timeline: '0-3 months'
      });
    } else if (ageYears > 30) {
      recommendations.push({
        type: 'INSPECTION',
        urgency: 'HIGH',
        description: `Pipe is ${ageYears.toFixed(1)} years old. Comprehensive inspection needed.`,
        estimatedCost: 'Medium',
        timeline: '1-2 months'
      });
    } else if (ageYears > 20) {
      recommendations.push({
        type: 'INSPECTION',
        urgency: 'MEDIUM',
        description: `Pipe approaching 20 years. Consider detailed inspection.`,
        estimatedCost: 'Low',
        timeline: '2-3 months'
      });
    }

    // Material-based recommendations
    if (pipe.material === 'Cast Iron' && ageYears > 20) {
      recommendations.push({
        type: 'MONITORING',
        urgency: 'HIGH',
        description: `Cast iron pipes over 20 years old are prone to corrosion. Increase monitoring frequency.`,
        estimatedCost: 'Low',
        timeline: 'Ongoing'
      });
    }

    // Pressure trend recommendations
    if (degradation && degradation.pressureTrend < -0.05) {
      recommendations.push({
        type: 'INVESTIGATION',
        urgency: 'HIGH',
        description: `Pressure declining trend detected. Investigate for leaks or internal degradation.`,
        estimatedCost: 'Medium',
        timeline: '1-2 weeks'
      });
    }

    // Volatility recommendations
    if (degradation && degradation.pressureVolatility > 3) {
      recommendations.push({
        type: 'MONITORING',
        urgency: 'MEDIUM',
        description: `High pressure volatility detected. Increase monitoring frequency.`,
        estimatedCost: 'Low',
        timeline: 'Ongoing'
      });
    }

    // Anomaly-based recommendations
    if (degradation && degradation.anomalyCount > 10) {
      recommendations.push({
        type: 'URGENT_INSPECTION',
        urgency: 'CRITICAL',
        description: `High number of anomalies detected. Schedule urgent inspection.`,
        estimatedCost: 'High',
        timeline: '1 week'
      });
    }

    // Location-specific recommendations
    if (leakLocations && leakLocations.length > 0) {
      const highRiskSegments = leakLocations.filter(l => l.riskScore > 60);
      if (highRiskSegments.length > 0) {
        recommendations.push({
          type: 'TARGETED_REPAIR',
          urgency: 'HIGH',
          description: `High-risk segments identified: ${highRiskSegments.map(s => `Segment ${s.segmentNumber}`).join(', ')}. Targeted inspection recommended.`,
          estimatedCost: 'Medium',
          timeline: '2-4 weeks'
        });
      }
    }

    // Previous leak recommendations
    if (pipe.previousLeakCount > 0) {
      recommendations.push({
        type: 'HISTORY_REVIEW',
        urgency: 'MEDIUM',
        description: `Pipe has history of ${pipe.previousLeakCount} previous leak(s). Review repair quality and monitor similar locations.`,
        estimatedCost: 'Low',
        timeline: '1-2 weeks'
      });
    }

    // Default if no specific issues
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'ROUTINE_MONITORING',
        urgency: 'LOW',
        description: `Pipe is in good condition. Continue routine monitoring.`,
        estimatedCost: 'Low',
        timeline: 'Ongoing'
      });
    }

    return recommendations;
  }
}

/**
 * Predictive Maintenance System
 */
class PredictiveMaintenanceSystem {
  constructor() {
    this.pipeSegments = [];
    this.maintenanceHistory = [];

    console.log('[PREDICTIVE_MAINTENANCE] System initialized');
  }

  /**
   * Add or register a pipe segment
   */
  registerPipe(pipeConfig) {
    const pipe = new PipeSegment(pipeConfig);
    this.pipeSegments.push(pipe);
    return pipe;
  }

  /**
   * Add reading to all pipes or specific pipe
   */
  addReading(reading, pipeId = null) {
    if (pipeId) {
      const pipe = this.pipeSegments.find(p => p.id === pipeId);
      if (pipe) {
        pipe.addReading(reading);
      }
    } else {
      // Add to first pipe (for simplicity)
      if (this.pipeSegments.length > 0) {
        this.pipeSegments[0].addReading(reading);
      }
    }
  }

  /**
   * Analyze all pipes and generate assessment
   */
  analyzeAllPipes() {
    const assessments = [];

    console.log(`\n${'═'.repeat(80)}`);
    console.log('[PREDICTIVE_MAINTENANCE] Analyzing all pipes...');
    console.log(`${'═'.repeat(80)}\n`);

    this.pipeSegments.forEach(pipe => {
      const assessment = this.analyzePipe(pipe);
      assessments.push(assessment);
    });

    return assessments;
  }

  /**
   * Analyze single pipe
   */
  analyzePipe(pipe) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`[PIPE ANALYSIS] ${pipe.name}`);
    console.log(`${'─'.repeat(80)}`);

    // Trend analysis
    const trendAnalyzer = new TrendAnalyzer(pipe);
    const degradation = trendAnalyzer.analyzeDegradation();

    if (degradation) {
      console.log(`[DEGRADATION ANALYSIS]`);
      console.log(`  Pressure Trend: ${degradation.pressureTrend.toFixed(6)} PSI/reading`);
      console.log(`  Flow Trend: ${degradation.flowTrend.toFixed(6)} L/min/reading`);
      console.log(`  Pressure Volatility: ${degradation.pressureVolatility.toFixed(3)} PSI`);
      console.log(`  Flow Volatility: ${degradation.flowVolatility.toFixed(3)} L/min`);
      console.log(`  Anomalies Detected: ${degradation.anomalyCount}`);
      console.log(`  Leaks Detected: ${degradation.leakCount}`);

      // Predict future values
      const predictions = trendAnalyzer.predictFutureValues(10);
      if (predictions) {
        const lastPrediction = predictions[predictions.length - 1];
        console.log(`[PREDICTIONS] (10 steps ahead)`);
        console.log(`  Predicted Pressure: ${lastPrediction.predictedPressure.toFixed(2)} PSI`);
        console.log(`  Predicted Flow: ${lastPrediction.predictedFlow.toFixed(2)} L/min`);
      }
    }

    // Risk scoring
    const riskScore = RiskScorer.calculateRiskScore(pipe, degradation);
    const riskLevel = RiskScorer.getRiskLevel(riskScore);
    const riskIcon = RiskScorer.getRiskIcon(riskLevel);

    console.log(`\n[RISK ASSESSMENT]`);
    console.log(`  ${riskIcon} Risk Level: ${riskLevel}`);
    console.log(`  Risk Score: ${riskScore.toFixed(1)}/100`);
    console.log(`  Age: ${pipe.getAgeYears().toFixed(2)} years`);
    console.log(`  Material: ${pipe.material} (degradation factor: ${pipe.getMaterialDegradationFactor()})`);
    console.log(`  Previous Leaks: ${pipe.previousLeakCount}`);

    // Leak location prediction
    const leakLocations = LeakLocationPredictor.predictLeakLocations(pipe, degradation);
    if (leakLocations) {
      console.log(`\n[LEAK LOCATION PREDICTION]`);
      leakLocations.slice(0, 3).forEach(location => {
        console.log(
          `  Segment ${location.segmentNumber} (${location.locationPercent.toFixed(0)}%): ${location.riskScore}% risk - ${location.likelihood}`
        );
      });
    }

    // Maintenance recommendations
    const recommendations = MaintenanceRecommender.generateRecommendations(
      pipe,
      riskScore,
      riskLevel,
      degradation,
      leakLocations
    );

    console.log(`\n[MAINTENANCE RECOMMENDATIONS]`);
    recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec.type} (${rec.urgency})`);
      console.log(`     ${rec.description}`);
      console.log(`     Timeline: ${rec.timeline}, Cost: ${rec.estimatedCost}`);
    });

    return {
      pipeId: pipe.id,
      pipeName: pipe.name,
      riskScore,
      riskLevel,
      degradation,
      leakLocations,
      recommendations,
      analysisDate: new Date().toISOString()
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const assessments = this.analyzeAllPipes();

    const report = {
      timestamp: getCurrentTimestamp(),
      totalPipes: this.pipeSegments.length,
      assessments,
      summary: {
        criticalCount: assessments.filter(a => a.riskLevel === 'CRITICAL').length,
        highCount: assessments.filter(a => a.riskLevel === 'HIGH').length,
        mediumCount: assessments.filter(a => a.riskLevel === 'MEDIUM').length,
        lowCount: assessments.filter(a => a.riskLevel === 'LOW').length,
        minimalCount: assessments.filter(a => a.riskLevel === 'MINIMAL').length,
        averageRiskScore:
          assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length
      }
    };

    console.log(`\n${'═'.repeat(80)}`);
    console.log('[COMPREHENSIVE REPORT]');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Total Pipes Analyzed: ${report.totalPipes}`);
    console.log(`Average Risk Score: ${report.summary.averageRiskScore.toFixed(1)}/100`);
    console.log(`\nRisk Distribution:`);
    console.log(`  🔴 Critical: ${report.summary.criticalCount}`);
    console.log(`  🟠 High: ${report.summary.highCount}`);
    console.log(`  🟡 Medium: ${report.summary.mediumCount}`);
    console.log(`  🟢 Low: ${report.summary.lowCount}`);
    console.log(`  ✅ Minimal: ${report.summary.minimalCount}`);
    console.log(`${'═'.repeat(80)}\n`);

    return report;
  }

  /**
   * Reset system
   */
  reset() {
    this.pipeSegments = [];
    this.maintenanceHistory = [];
    console.log('[PREDICTIVE_MAINTENANCE] System reset');
  }
}

// Create singleton instance
const maintenanceSystem = new PredictiveMaintenanceSystem();

module.exports = {
  PipeSegment,
  TrendAnalyzer,
  RiskScorer,
  LeakLocationPredictor,
  MaintenanceRecommender,
  PredictiveMaintenanceSystem,
  maintenanceSystem
};

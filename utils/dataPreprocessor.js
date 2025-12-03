/**
 * Data Preprocessing Module
 * Processes raw sensor readings and calculates engineered features
 * Handles data validation, missing values, outliers, and quality logging
 */

const { getCurrentTimestamp } = require('./helpers');

/**
 * Configuration for data preprocessing
 */
const CONFIG = {
  MOVING_AVERAGE_WINDOW: 30, // seconds
  STDDEV_WINDOW: 60, // seconds
  SPIKE_THRESHOLD: 2, // standard deviations
  OUTLIER_PRESSURE_BOUNDS: { min: 0, max: 100 }, // PSI
  OUTLIER_FLOW_BOUNDS: { min: 0, max: 150 }, // L/min
  MIN_WINDOW_SIZE: 3 // Minimum data points for statistics calculation
};

class DataPreprocessor {
  constructor() {
    this.sensorHistory = []; // Circular buffer of sensor readings
    this.maxHistorySize = 120; // Keep 2 minutes of data for 60-second windows
    this.featureHistory = [];
    this.qualityMetrics = {
      totalProcessed: 0,
      validRecords: 0,
      invalidRecords: 0,
      missingValues: 0,
      outliers: 0,
      spikes: 0
    };
    this.lastLogTime = getCurrentTimestamp();

    console.log('[PREPROCESSOR] Data Preprocessor initialized');
    console.log(`[PREPROCESSOR] Moving average window: ${CONFIG.MOVING_AVERAGE_WINDOW}s`);
    console.log(`[PREPROCESSOR] Std Dev window: ${CONFIG.STDDEV_WINDOW}s`);
    console.log(`[PREPROCESSOR] Spike threshold: ${CONFIG.SPIKE_THRESHOLD} standard deviations`);
  }

  /**
   * Validate sensor reading
   */
  _validateSensorReading(reading) {
    const issues = [];

    // Check for required fields
    if (reading.pressure === null || reading.pressure === undefined) {
      issues.push('Missing pressure value');
    } else if (typeof reading.pressure !== 'number') {
      issues.push(`Pressure is not a number: ${typeof reading.pressure}`);
    }

    if (reading.flow === null || reading.flow === undefined) {
      issues.push('Missing flow value');
    } else if (typeof reading.flow !== 'number') {
      issues.push(`Flow is not a number: ${typeof reading.flow}`);
    }

    if (reading.timestamp === null || reading.timestamp === undefined) {
      reading.timestamp = getCurrentTimestamp();
      issues.push('Missing timestamp, using current time');
    }

    // Check for bounds violations (outliers)
    if (typeof reading.pressure === 'number') {
      if (
        reading.pressure < CONFIG.OUTLIER_PRESSURE_BOUNDS.min ||
        reading.pressure > CONFIG.OUTLIER_PRESSURE_BOUNDS.max
      ) {
        issues.push(
          `Pressure outlier: ${reading.pressure} PSI (bounds: ${CONFIG.OUTLIER_PRESSURE_BOUNDS.min}-${CONFIG.OUTLIER_PRESSURE_BOUNDS.max})`
        );
        this.qualityMetrics.outliers++;
      }
    }

    if (typeof reading.flow === 'number') {
      if (
        reading.flow < CONFIG.OUTLIER_FLOW_BOUNDS.min ||
        reading.flow > CONFIG.OUTLIER_FLOW_BOUNDS.max
      ) {
        issues.push(
          `Flow outlier: ${reading.flow} L/min (bounds: ${CONFIG.OUTLIER_FLOW_BOUNDS.min}-${CONFIG.OUTLIER_FLOW_BOUNDS.max})`
        );
        this.qualityMetrics.outliers++;
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      hasOutliers: issues.some(i => i.includes('outlier'))
    };
  }

  /**
   * Calculate rate of change (delta per second)
   */
  _calculateRateOfChange(currentValue, previousValue, timeDeltaMs) {
    if (previousValue === null || previousValue === undefined) {
      return 0;
    }

    if (timeDeltaMs === 0) {
      return 0;
    }

    const timeDeltaSec = timeDeltaMs / 1000;
    return (currentValue - previousValue) / timeDeltaSec;
  }

  /**
   * Calculate moving average over a time window
   */
  _calculateMovingAverage(fieldName, windowSec) {
    const windowMs = windowSec * 1000;
    const now = getCurrentTimestamp();
    const windowStart = now - windowMs;

    const relevantReadings = this.sensorHistory.filter(
      reading => reading.timestamp >= windowStart
    );

    if (relevantReadings.length < CONFIG.MIN_WINDOW_SIZE) {
      return null;
    }

    const sum = relevantReadings.reduce((acc, reading) => acc + reading[fieldName], 0);
    return sum / relevantReadings.length;
  }

  /**
   * Calculate standard deviation over a time window
   */
  _calculateStdDev(fieldName, windowSec) {
    const windowMs = windowSec * 1000;
    const now = getCurrentTimestamp();
    const windowStart = now - windowMs;

    const relevantReadings = this.sensorHistory.filter(
      reading => reading.timestamp >= windowStart
    );

    if (relevantReadings.length < CONFIG.MIN_WINDOW_SIZE) {
      return null;
    }

    const mean = relevantReadings.reduce((acc, reading) => acc + reading[fieldName], 0) /
      relevantReadings.length;

    const variance =
      relevantReadings.reduce((acc, reading) => {
        return acc + Math.pow(reading[fieldName] - mean, 2);
      }, 0) / relevantReadings.length;

    return Math.sqrt(variance);
  }

  /**
   * Detect anomalous spikes (>N standard deviations from mean)
   */
  _detectSpike(fieldName, currentValue, windowSec) {
    const windowMs = windowSec * 1000;
    const now = getCurrentTimestamp();
    const windowStart = now - windowMs;

    const relevantReadings = this.sensorHistory.filter(
      reading => reading.timestamp >= windowStart
    );

    if (relevantReadings.length < CONFIG.MIN_WINDOW_SIZE) {
      return false;
    }

    const mean = relevantReadings.reduce((acc, reading) => acc + reading[fieldName], 0) /
      relevantReadings.length;

    const stdDev = Math.sqrt(
      relevantReadings.reduce((acc, reading) => {
        return acc + Math.pow(reading[fieldName] - mean, 2);
      }, 0) / relevantReadings.length
    );

    if (stdDev === 0) {
      return false;
    }

    const zScore = Math.abs((currentValue - mean) / stdDev);
    return zScore > CONFIG.SPIKE_THRESHOLD;
  }

  /**
   * Calculate pressure-to-flow ratio
   */
  _calculatePressureFlowRatio(pressure, flow) {
    if (flow === 0 || flow < 0.1) {
      return 0;
    }
    return pressure / flow;
  }

  /**
   * Extract time-based features
   */
  _extractTimeFeatures(timestamp) {
    const date = new Date(timestamp);

    return {
      hour_of_day: date.getHours(),
      day_of_week: date.getDay(), // 0 = Sunday, 6 = Saturday
      day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        date.getDay()
      ],
      is_weekend: [0, 6].includes(date.getDay()),
      minute_of_hour: date.getMinutes(),
      time_str: date.toISOString()
    };
  }

  /**
   * Process raw sensor reading and return engineered features
   */
  processReading(reading) {
    this.qualityMetrics.totalProcessed++;

    // Validate reading
    const validation = this._validateSensorReading(reading);

    if (!validation.isValid) {
      console.error('[PREPROCESSOR] Invalid sensor reading detected');
      validation.issues.forEach(issue => {
        console.error(`  ✗ ${issue}`);
      });
      this.qualityMetrics.invalidRecords++;
      return null;
    }

    // Normalize input
    const normalizedReading = {
      id: reading.id,
      timestamp: reading.timestamp,
      pressure: parseFloat(reading.pressure),
      flow: parseFloat(reading.flow),
      leak_status: Boolean(reading.leak_status),
      valve_state: reading.valve_state
    };

    // Add to history
    this.sensorHistory.push(normalizedReading);

    // Maintain circular buffer
    if (this.sensorHistory.length > this.maxHistorySize) {
      this.sensorHistory.shift();
    }

    // Get previous reading for delta calculations
    const previousReading = this.sensorHistory[this.sensorHistory.length - 2];
    const timeDeltaMs = previousReading
      ? normalizedReading.timestamp - previousReading.timestamp
      : 1000;

    // Calculate engineered features
    const features = {
      id: normalizedReading.id,
      timestamp: normalizedReading.timestamp,

      // Raw values
      pressure: normalizedReading.pressure,
      flow: normalizedReading.flow,
      leak_status: normalizedReading.leak_status,
      valve_state: normalizedReading.valve_state,

      // Rate of change features
      pressure_rate_of_change: this._calculateRateOfChange(
        normalizedReading.pressure,
        previousReading ? previousReading.pressure : null,
        timeDeltaMs
      ),
      flow_rate_of_change: this._calculateRateOfChange(
        normalizedReading.flow,
        previousReading ? previousReading.flow : null,
        timeDeltaMs
      ),

      // Moving averages (30-second window)
      pressure_ma_30s: this._calculateMovingAverage('pressure', 30),
      flow_ma_30s: this._calculateMovingAverage('flow', 30),

      // Standard deviations (60-second window)
      pressure_stddev_60s: this._calculateStdDev('pressure', 60),
      flow_stddev_60s: this._calculateStdDev('flow', 60),

      // Pressure-to-flow ratio
      pressure_flow_ratio: this._calculatePressureFlowRatio(
        normalizedReading.pressure,
        normalizedReading.flow
      ),

      // Anomaly detection
      pressure_spike_detected: this._detectSpike('pressure', normalizedReading.pressure, 60),
      flow_spike_detected: this._detectSpike('flow', normalizedReading.flow, 60),

      // Time-based features
      ...this._extractTimeFeatures(normalizedReading.timestamp),

      // Data quality flags
      is_outlier: validation.hasOutliers,
      data_quality_score: this._calculateDataQualityScore(normalizedReading, validation)
    };

    // Update quality metrics
    this.qualityMetrics.validRecords++;

    // Log spike detections
    if (features.pressure_spike_detected || features.flow_spike_detected) {
      this.qualityMetrics.spikes++;
      const spikeTypes = [];
      if (features.pressure_spike_detected) spikeTypes.push('PRESSURE');
      if (features.flow_spike_detected) spikeTypes.push('FLOW');

      console.warn(
        `[PREPROCESSOR] ⚠️  SPIKE DETECTED (${spikeTypes.join(', ')}) at ${new Date(
          normalizedReading.timestamp
        ).toISOString()}`
      );
      console.warn(
        `  Pressure: ${normalizedReading.pressure} PSI (μ=${features.pressure_ma_30s?.toFixed(2)}, σ=${features.pressure_stddev_60s?.toFixed(2)})`
      );
      console.warn(
        `  Flow: ${normalizedReading.flow} L/min (μ=${features.flow_ma_30s?.toFixed(2)}, σ=${features.flow_stddev_60s?.toFixed(2)})`
      );
    }

    // Store in feature history
    this.featureHistory.push(features);
    if (this.featureHistory.length > this.maxHistorySize) {
      this.featureHistory.shift();
    }

    return features;
  }

  /**
   * Calculate overall data quality score (0-1)
   */
  _calculateDataQualityScore(reading, validation) {
    let score = 1.0;

    // Deduct for outliers
    if (validation.hasOutliers) {
      score -= 0.2;
    }

    // Deduct for issues
    score -= validation.issues.length * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Batch process multiple readings
   */
  processReadingsBatch(readings) {
    console.log(`[PREPROCESSOR] Processing batch of ${readings.length} readings...`);

    const processedFeatures = readings
      .map(reading => this.processReading(reading))
      .filter(f => f !== null);

    console.log(`[PREPROCESSOR] ✓ Batch processing complete: ${processedFeatures.length}/${readings.length} valid`);

    return processedFeatures;
  }

  /**
   * Get quality report
   */
  getQualityReport() {
    const validationRate = this.qualityMetrics.totalProcessed > 0 
      ? ((this.qualityMetrics.validRecords / this.qualityMetrics.totalProcessed) * 100).toFixed(2)
      : 0;

    return {
      timestamp: getCurrentTimestamp(),
      totalProcessed: this.qualityMetrics.totalProcessed,
      validRecords: this.qualityMetrics.validRecords,
      invalidRecords: this.qualityMetrics.invalidRecords,
      outliers: this.qualityMetrics.outliers,
      spikesDetected: this.qualityMetrics.spikes,
      validationRate: `${validationRate}%`,
      dataPoints: this.sensorHistory.length,
      features: this.featureHistory.length
    };
  }

  /**
   * Get feature statistics
   */
  getFeatureStatistics() {
    if (this.featureHistory.length === 0) {
      return null;
    }

    const features = this.featureHistory;
    const lastN = Math.min(100, features.length);
    const recentFeatures = features.slice(-lastN);

    const calculateStats = (values) => {
      const validValues = values.filter(v => v !== null && typeof v === 'number');
      if (validValues.length === 0) return null;

      const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
      const sorted = validValues.sort((a, b) => a - b);

      return {
        mean: Math.round(mean * 100) / 100,
        min: Math.round(Math.min(...validValues) * 100) / 100,
        max: Math.round(Math.max(...validValues) * 100) / 100,
        median: sorted[Math.floor(sorted.length / 2)],
        count: validValues.length
      };
    };

    return {
      lastNRecords: lastN,
      pressure: calculateStats(recentFeatures.map(f => f.pressure)),
      flow: calculateStats(recentFeatures.map(f => f.flow)),
      pressure_rate: calculateStats(recentFeatures.map(f => f.pressure_rate_of_change)),
      flow_rate: calculateStats(recentFeatures.map(f => f.flow_rate_of_change)),
      pressure_ma_30s: calculateStats(recentFeatures.map(f => f.pressure_ma_30s)),
      flow_ma_30s: calculateStats(recentFeatures.map(f => f.flow_ma_30s)),
      pressure_stddev: calculateStats(recentFeatures.map(f => f.pressure_stddev_60s)),
      flow_stddev: calculateStats(recentFeatures.map(f => f.flow_stddev_60s)),
      pressure_flow_ratio: calculateStats(recentFeatures.map(f => f.pressure_flow_ratio)),
      avg_data_quality: Math.round(
        (recentFeatures.reduce((sum, f) => sum + f.data_quality_score, 0) / lastN) * 100
      ) / 100
    };
  }

  /**
   * Log detailed quality report
   */
  logQualityReport() {
    const report = this.getQualityReport();
    const stats = this.getFeatureStatistics();

    console.log(`\n${'═'.repeat(80)}`);
    console.log('[DATA QUALITY REPORT]');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    console.log(`Total Processed: ${report.totalProcessed}`);
    console.log(`Valid Records: ${report.validRecords}`);
    console.log(`Invalid Records: ${report.invalidRecords}`);
    console.log(`Validation Rate: ${report.validationRate}`);
    console.log(`Outliers Detected: ${report.outliers}`);
    console.log(`Spikes Detected: ${report.spikesDetected}`);
    console.log(`Active Data Points: ${report.dataPoints}`);
    console.log(`Feature Vectors: ${report.features}`);

    if (stats) {
      console.log(`${'─'.repeat(80)}`);
      console.log('[FEATURE STATISTICS] (Last ${stats.lastNRecords} records)');
      console.log(`${'─'.repeat(80)}`);
      console.log(
        `Pressure: mean=${stats.pressure.mean}, min=${stats.pressure.min}, max=${stats.pressure.max} PSI`
      );
      console.log(
        `Flow: mean=${stats.flow.mean}, min=${stats.flow.min}, max=${stats.flow.max} L/min`
      );
      console.log(
        `Pressure Rate: mean=${stats.pressure_rate.mean}, min=${stats.pressure_rate.min}, max=${stats.pressure_rate.max} PSI/s`
      );
      console.log(
        `Flow Rate: mean=${stats.flow_rate.mean}, min=${stats.flow_rate.min}, max=${stats.flow_rate.max} L/min/s`
      );
      console.log(`Avg Data Quality Score: ${stats.avg_data_quality}`);
    }

    console.log(`${'═'.repeat(80)}\n`);
  }

  /**
   * Reset preprocessor state
   */
  reset() {
    this.sensorHistory = [];
    this.featureHistory = [];
    this.qualityMetrics = {
      totalProcessed: 0,
      validRecords: 0,
      invalidRecords: 0,
      missingValues: 0,
      outliers: 0,
      spikes: 0
    };

    console.log('[PREPROCESSOR] State reset');
  }

  /**
   * Export features as JSON
   */
  exportFeatures(count = null) {
    const features = count ? this.featureHistory.slice(-count) : this.featureHistory;
    return {
      exportDate: new Date().toISOString(),
      count: features.length,
      features
    };
  }
}

// Create singleton instance
const preprocessor = new DataPreprocessor();

module.exports = {
  DataPreprocessor,
  preprocessor,
  CONFIG
};

/**
 * Integrated API Controller
 * Bridges the integrated leak detection engine with Express API endpoints
 */

const { integratedEngine } = require('../utils/integratedEngine');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Initialize the integrated detection engine with default settings
 */
const initializeEngine = asyncHandler(async (req, res) => {
  const { baselinePressure = 50, baselineFlow = 10, useMLDetection = true, usePredictiveMaintenance = true } = req.body;

  try {
    // Initialize rule-based detection
    integratedEngine.initializeRuleBasedDetection(baselinePressure, baselineFlow);

    // Initialize ML detection if requested
    if (useMLDetection) {
      integratedEngine.initializeMLDetection();
    }

    // Initialize predictive maintenance if requested
    if (usePredictiveMaintenance) {
      const pipeConfigs = req.body.pipeConfigs || [
        {
          name: 'Main Distribution Line',
          material: 'Cast Iron',
          diameter: 50,
          length: 500,
          installationDate: Date.now() - 25 * 365 * 24 * 60 * 60 * 1000,
          previousLeakCount: 2
        }
      ];
      integratedEngine.initializePredictiveMaintenance(pipeConfigs);
    }

    const status = integratedEngine.getSystemStatus();

    res.json({
      success: true,
      message: 'Integrated detection engine initialized',
      data: status
    });
  } catch (error) {
    throw new AppError('Failed to initialize engine: ' + error.message, 500);
  }
});

/**
 * Process sensor reading through integrated detection pipeline
 */
const processIntegratedReading = asyncHandler(async (req, res) => {
  const { pressure, flow, valve_state = 'OPEN', temperature = 20 } = req.body;

  if (typeof pressure !== 'number' || typeof flow !== 'number') {
    throw new AppError('Pressure and flow must be numeric values', 400);
  }

  try {
    const result = integratedEngine.processReading({
      pressure,
      flow,
      valve_state,
      temperature,
      timestamp: Date.now()
    });

    if (!result) {
      throw new AppError('Processing failed', 500);
    }

    res.json({
      success: true,
      data: result,
      message: result.detection.overallLeakDetected ? '⚠️  Leak detected' : '✓ No leak detected'
    });
  } catch (error) {
    throw new AppError('Processing failed: ' + error.message, 500);
  }
});

/**
 * GET /api/detection/status
 * Get current system status and health
 */
const getDetectionStatus = asyncHandler(async (req, res) => {
  const status = integratedEngine.getSystemStatus();
  const patterns = integratedEngine.analyzeHistoricalPatterns();

  res.json({
    success: true,
    data: {
      systemStatus: status,
      detectionPatterns: patterns,
      recentAlertCount: integratedEngine.alerts.length,
      systemHealth: integratedEngine._assessSystemHealth(patterns, status)
    }
  });
});

/**
 * GET /api/detection/recent
 * Get recent detections with optional filtering
 */
const getRecentDetections = asyncHandler(async (req, res) => {
  const { count = 100, leaksOnly = false } = req.query;

  let detections = integratedEngine.getRecentDetections(parseInt(count));

  if (leaksOnly === 'true') {
    detections = detections.filter(d => d.detection.overallLeakDetected);
  }

  res.json({
    success: true,
    data: detections,
    count: detections.length
  });
});

/**
 * GET /api/detection/alerts
 * Get recent alerts
 */
const getRecentAlerts = asyncHandler(async (req, res) => {
  const { count = 50, severity = null } = req.query;

  let alerts = integratedEngine.getRecentAlerts(parseInt(count));

  if (severity) {
    alerts = alerts.filter(a => a.severity === severity.toUpperCase());
  }

  res.json({
    success: true,
    data: alerts,
    count: alerts.length
  });
});

/**
 * GET /api/detection/patterns
 * Analyze detection patterns
 */
const getDetectionPatterns = asyncHandler(async (req, res) => {
  const patterns = integratedEngine.analyzeHistoricalPatterns();

  if (!patterns) {
    throw new AppError('Insufficient data for pattern analysis', 400);
  }

  res.json({
    success: true,
    data: patterns
  });
});

/**
 * GET /api/detection/report
 * Get comprehensive system report
 */
const getComprehensiveReport = asyncHandler(async (req, res) => {
  const report = integratedEngine.getComprehensiveReport();

  res.json({
    success: true,
    data: report
  });
});

/**
 * POST /api/detection/reset
 * Reset the detection engine
 */
const resetDetectionEngine = asyncHandler(async (req, res) => {
  integratedEngine.reset();

  res.json({
    success: true,
    message: 'Detection engine reset successfully'
  });
});

/**
 * GET /api/detection/system-info
 * Get detailed system information
 */
const getSystemInfo = asyncHandler(async (req, res) => {
  const status = integratedEngine.getSystemStatus();

  res.json({
    success: true,
    data: {
      version: '1.0.0',
      status: status.status,
      timestamp: status.timestamp,
      systems: {
        ruleBased: {
          enabled: status.systems.ruleBasedReady,
          description: 'Rule-based leak detection with threshold analysis'
        },
        mlAnomaly: {
          enabled: status.systems.mlModelReady,
          description: 'Machine learning anomaly detection using Isolation Forest',
          modelInfo: status.systems.mlModelReady ? {
            trees: 100,
            features: 11
          } : null
        },
        preprocessing: {
          enabled: status.systems.preprocessorReady,
          description: 'Data preprocessing with engineered features'
        },
        predictiveMaintenance: {
          enabled: status.systems.maintenanceReady,
          description: 'Predictive maintenance with trend analysis'
        }
      },
      statistics: status.statistics
    }
  });
});

/**
 * POST /api/detection/batch-process
 * Process multiple readings at once
 */
const batchProcessReadings = asyncHandler(async (req, res) => {
  const { readings } = req.body;

  if (!Array.isArray(readings)) {
    throw new AppError('Readings must be an array', 400);
  }

  if (readings.length === 0) {
    throw new AppError('At least one reading required', 400);
  }

  const results = [];
  let processedCount = 0;
  let leakDetectionCount = 0;

  readings.forEach(reading => {
    try {
      const result = integratedEngine.processReading(reading);
      if (result) {
        results.push(result);
        processedCount++;
        if (result.detection.overallLeakDetected) {
          leakDetectionCount++;
        }
      }
    } catch (error) {
      // Continue with next reading on error
      console.error('Error processing reading:', error.message);
    }
  });

  res.json({
    success: true,
    data: results,
    summary: {
      totalReadings: readings.length,
      processedReadings: processedCount,
      leakDetections: leakDetectionCount,
      leakDetectionRate: ((leakDetectionCount / processedCount) * 100).toFixed(2) + '%'
    }
  });
});

/**
 * GET /api/detection/maintenance-report
 * Get predictive maintenance report
 */
const getMaintenanceReport = asyncHandler(async (req, res) => {
  if (!integratedEngine.systemStatus.maintenanceReady) {
    throw new AppError('Predictive maintenance system not initialized', 400);
  }

  const report = integratedEngine.integratedEngine
    ? integratedEngine.getComprehensiveReport().maintenanceAssessment
    : null;

  if (!report) {
    const assessment = integratedEngine.maintenanceSystem?.analyzeAllPipes?.();
    res.json({
      success: true,
      data: assessment || { error: 'No maintenance data available' }
    });
  } else {
    res.json({
      success: true,
      data: report
    });
  }
});

module.exports = {
  initializeEngine,
  processIntegratedReading,
  getDetectionStatus,
  getRecentDetections,
  getRecentAlerts,
  getDetectionPatterns,
  getComprehensiveReport,
  resetDetectionEngine,
  getSystemInfo,
  batchProcessReadings,
  getMaintenanceReport
};

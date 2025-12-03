const { dbRun, dbGet, dbAll } = require('../db/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateId, getCurrentTimestamp, formatSensorData } = require('../utils/helpers');
const { model } = require('../utils/mlModel');

// Global valve state
let valveState = {
  state: 'CLOSED',
  lastUpdated: getCurrentTimestamp(),
  lastAction: null
};

/**
 * GET /api/leak-detection
 * Get current leak detection status and predictions
 */
const getLeakDetectionStatus = asyncHandler(async (req, res) => {
  try {
    // Get the most recent sensor reading
    const latestReading = await dbGet(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
    );

    if (!latestReading) {
      throw new AppError('No sensor data available', 404);
    }

    // Use ML model to predict leak probability
    const leakProbability = model.predictLeak(
      latestReading.pressure,
      latestReading.flow,
      latestReading.valve_state
    );

    // Determine risk level based on probability
    let riskLevel = 'LOW';
    if (leakProbability > 0.7) {
      riskLevel = 'CRITICAL';
    } else if (leakProbability > 0.5) {
      riskLevel = 'HIGH';
    } else if (leakProbability > 0.3) {
      riskLevel = 'MEDIUM';
    }

    // Auto-close valve if risk is critical
    if (riskLevel === 'CRITICAL' && valveState.state !== 'CLOSED') {
      await controlValve('CLOSE', 'Automatic closure - Critical leak detected');
    }

    // Get recent leak events
    const recentLeaks = await dbAll(
      'SELECT * FROM sensor_data WHERE leak_status = 1 ORDER BY timestamp DESC LIMIT 10'
    );

    res.json({
      success: true,
      data: {
        currentStatus: {
          leakDetected: latestReading.leak_status === 1,
          leakProbability: Math.round(leakProbability * 10000) / 100 + '%',
          riskLevel,
          timestamp: latestReading.timestamp
        },
        sensorReadings: formatSensorData(latestReading),
        valveState: valveState.state,
        modelInfo: model.getModelInfo(),
        recentLeakEvents: recentLeaks.map(formatSensorData)
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get leak detection status', 500);
  }
});

/**
 * GET /api/leak-detection/predictions
 * Get leak predictions for historical data
 */
const getLeakPredictions = asyncHandler(async (req, res) => {
  const { limit = 100 } = req.query;

  try {
    const recentReadings = await dbAll(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT ?',
      [parseInt(limit)]
    );

    const predictions = recentReadings.map(reading => ({
      id: reading.id,
      timestamp: reading.timestamp,
      pressure: reading.pressure,
      flow: reading.flow,
      leakProbability: Math.round(
        model.predictLeak(reading.pressure, reading.flow, reading.valve_state) * 10000
      ) / 100 + '%',
      actualLeakStatus: reading.leak_status === 1,
      valve_state: reading.valve_state
    }));

    res.json({
      success: true,
      data: predictions.reverse(), // Oldest first for chronological view
      modelVersion: model.modelVersion
    });
  } catch (error) {
    throw new AppError('Failed to get leak predictions', 500);
  }
});

/**
 * Internal function to control valve
 */
const controlValve = async (operation, reason = null) => {
  const validOperations = ['OPEN', 'CLOSE'];
  
  if (!validOperations.includes(operation)) {
    throw new AppError(`Invalid operation. Must be one of: ${validOperations.join(', ')}`, 400);
  }

  valveState.state = operation === 'OPEN' ? 'OPEN' : 'CLOSED';
  valveState.lastUpdated = getCurrentTimestamp();
  valveState.lastAction = operation;

  // Log valve control action
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  try {
    await dbRun(
      `INSERT INTO valve_control_logs (id, operation, timestamp, reason, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, operation, timestamp, reason || 'Manual control', 'SUCCESS']
    );
  } catch (error) {
    console.error('Failed to log valve control action:', error);
  }
};

/**
 * POST /api/valve-control
 * Open or close the main water valve
 */
const controlValveEndpoint = asyncHandler(async (req, res) => {
  const { operation, reason } = req.body;

  if (!operation) {
    throw new AppError('Operation parameter is required (OPEN or CLOSE)', 400);
  }

  try {
    await controlValve(operation, reason);

    res.json({
      success: true,
      data: {
        operation,
        newState: valveState.state,
        timestamp: valveState.lastUpdated,
        message: `Valve ${operation === 'OPEN' ? 'opened' : 'closed'} successfully`
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Valve control operation failed', 500);
  }
});

/**
 * GET /api/valve-control/status
 * Get current valve status
 */
const getValveStatus = asyncHandler(async (req, res) => {
  try {
    const recentActions = await dbAll(
      'SELECT * FROM valve_control_logs ORDER BY timestamp DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        currentState: valveState.state,
        lastUpdated: valveState.lastUpdated,
        lastAction: valveState.lastAction,
        recentActions: recentActions.map(action => ({
          operation: action.operation,
          timestamp: action.timestamp,
          reason: action.reason,
          status: action.status
        }))
      }
    });
  } catch (error) {
    throw new AppError('Failed to get valve status', 500);
  }
});

/**
 * GET /api/valve-control/history
 * Get valve control history
 */
const getValveHistory = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const history = await dbAll(
      'SELECT * FROM valve_control_logs ORDER BY timestamp DESC LIMIT ?',
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: history.map(record => ({
        id: record.id,
        operation: record.operation,
        timestamp: record.timestamp,
        reason: record.reason,
        status: record.status,
        createdAt: record.created_at
      }))
    });
  } catch (error) {
    throw new AppError('Failed to retrieve valve history', 500);
  }
});

module.exports = {
  getLeakDetectionStatus,
  getLeakPredictions,
  controlValveEndpoint,
  getValveStatus,
  getValveHistory
};

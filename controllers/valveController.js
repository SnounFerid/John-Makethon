const { dbRun, dbGet, dbAll } = require('../db/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateId, getCurrentTimestamp } = require('../utils/helpers');

// Global valve state - in-memory only (no hardware)
let valveState = {
  state: 'OPEN',
  lastUpdated: getCurrentTimestamp(),
  lastAction: 'OPEN'
};

/**
 * POST /api/valve/control
 * Manually open or close the valve
 */
const controlValve = asyncHandler(async (req, res) => {
  const { operation } = req.body;

  if (!['OPEN', 'CLOSE'].includes(operation)) {
    throw new AppError('Operation must be OPEN or CLOSE', 400);
  }

  // Update valve state
  valveState.state = operation;
  valveState.lastUpdated = getCurrentTimestamp();
  valveState.lastAction = operation;

  // Log the action
  try {
    await dbRun(
      `INSERT INTO valve_control_logs (id, operation, timestamp, reason, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [generateId(), operation, valveState.lastUpdated, 'Manual control', 'SUCCESS']
    );
  } catch (error) {
    console.warn('[VALVE] Failed to log action:', error.message);
  }

  console.log(`[VALVE-CONTROL] Valve manually ${operation}ed at ${valveState.lastUpdated}`);

  res.json({
    success: true,
    data: {
      state: valveState.state,
      timestamp: valveState.lastUpdated,
      message: `Valve ${operation}ed successfully`
    }
  });
});

/**
 * GET /api/valve/status
 * Get current valve status
 */
const getValveStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      state: valveState.state,
      lastUpdated: valveState.lastUpdated,
      lastAction: valveState.lastAction
    }
  });
});

/**
 * GET /api/valve/history
 * Get valve control history
 */
const getValveHistory = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  try {
    const history = await dbAll(
      'SELECT * FROM valve_control_logs ORDER BY timestamp DESC LIMIT ?',
      [parseInt(limit)]
    ) || [];

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    throw new AppError('Failed to get valve history', 500);
  }
});

module.exports = {
  controlValve,
  getValveStatus,
  getValveHistory,
  valveState
};

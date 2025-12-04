const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ID
 */
const generateId = () => {
  return uuidv4();
};

/**
 * Get current timestamp in milliseconds
 */
const getCurrentTimestamp = () => {
  return Date.now();
};

/**
 * Validate sensor data
 */
const validateSensorData = (data) => {
  const errors = [];

  if (typeof data.pressure !== 'number' || data.pressure < 0) {
    errors.push('Pressure must be a positive number');
  }

  if (typeof data.flow !== 'number' || data.flow < 0) {
    errors.push('Flow must be a positive number');
  }

  if (typeof data.leak_status !== 'boolean') {
    errors.push('Leak status must be a boolean');
  }

  if (!['OPEN', 'CLOSED'].includes(data.valve_state)) {
    errors.push('Valve state must be OPEN or CLOSED');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format sensor data for response
 */
const formatSensorData = (row) => {
  return {
    id: row.id,
    timestamp: row.timestamp,
    pressure: row.pressure,
    flow: row.flow,
    leak_status: Boolean(row.leak_status),
    valve_state: row.valve_state,
    temperature: typeof row.temperature !== 'undefined' && row.temperature !== null ? parseFloat(row.temperature) : null,
    conductivity: typeof row.conductivity !== 'undefined' && row.conductivity !== null ? parseFloat(row.conductivity) : null,
    location: row.location || null,
    created_at: row.created_at
  };
};

/**
 * Detect leaks based on sensor readings
 * Simple heuristic: high flow with low pressure or sudden flow increase
 */
const detectLeak = (pressure, flow, previousFlow = null) => {
  const PRESSURE_THRESHOLD = 1.0; // bar
  const FLOW_THRESHOLD = 50; // L/min
  const FLOW_INCREASE_THRESHOLD = 30; // L/min increase

  // Low pressure with high flow indicates potential leak
  if (pressure < PRESSURE_THRESHOLD && flow > FLOW_THRESHOLD) {
    return true;
  }

  // Sudden increase in flow
  if (previousFlow !== null) {
    const flowIncrease = flow - previousFlow;
    if (flowIncrease > FLOW_INCREASE_THRESHOLD) {
      return true;
    }
  }

  return false;
};

module.exports = {
  generateId,
  getCurrentTimestamp,
  validateSensorData,
  formatSensorData,
  detectLeak
};

const { dbRun, dbGet, dbAll } = require('../db/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { 
  generateId, 
  getCurrentTimestamp, 
  validateSensorData, 
  formatSensorData,
  detectLeak 
} = require('../utils/helpers');
const { integratedEngine } = require('../utils/integratedEngine');
const { valveState } = require('./leakDetectionController');

/**
 * POST /api/sensor-data
 * Add new sensor reading
 */
const addSensorData = asyncHandler(async (req, res) => {
  const { pressure, flow, valve_state, temperature, conductivity, location } = req.body;

  // Validate input and include optional fields
  const sensorData = {
    pressure: parseFloat(pressure),
    flow: parseFloat(flow),
    leak_status: false,
    valve_state: valve_state || 'CLOSED',
    temperature: typeof temperature !== 'undefined' ? parseFloat(temperature) : null,
    conductivity: typeof conductivity !== 'undefined' ? parseFloat(conductivity) : null,
    location: location || null
  };

  const validation = validateSensorData(sensorData);
  if (!validation.isValid) {
    throw new AppError(`Validation failed: ${validation.errors.join(', ')}`, 400);
  }

  // If valve is closed, ignore incoming readings because there's no flow
  try {
    if (valveState && String(valveState.state).toUpperCase() === 'CLOSED') {
      // Do not persist or broadcast readings while valve is closed
      return res.status(200).json({
        success: false,
        message: 'Valve is closed; reading ignored',
        data: null
      });
    }
  } catch (e) {
    // If valve state cannot be determined, proceed normally
    console.warn('[SENSOR] Could not read valve state, proceeding to save reading', e.message || e);
  }

  // Check for leak
  const leakStatus = detectLeak(sensorData.pressure, sensorData.flow);

  const id = generateId();
  const timestamp = getCurrentTimestamp();

  try {
    await dbRun(
      `INSERT INTO sensor_data (id, timestamp, pressure, flow, leak_status, valve_state, temperature, conductivity, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        timestamp,
        sensorData.pressure,
        sensorData.flow,
        leakStatus ? 1 : 0,
        sensorData.valve_state,
        sensorData.temperature,
        sensorData.conductivity,
        sensorData.location
      ]
    );

    // Include optional fields in response payload so clients receive temperature etc.
    const responsePayload = {
      id,
      timestamp,
      pressure: sensorData.pressure,
      flow: sensorData.flow,
      leak_status: leakStatus,
      valve_state: sensorData.valve_state,
      temperature: sensorData.temperature,
      conductivity: sensorData.conductivity,
      location: sensorData.location
    };

    // Broadcast the new sensor update to connected WebSocket clients (if available)
    try {
      if (req && req.app && req.app.wsService) {
        req.app.wsService.broadcastToAll('sensor:update', responsePayload);

        // If a leak was detected, also broadcast an alert
        if (leakStatus) {
          const alert = {
            id: generateId(),
            severity: sensorData.pressure < 0.5 ? 'CRITICAL' : 'HIGH',
            message: 'Possible leak detected based on incoming sensor reading',
            data: responsePayload,
            timestamp
          };
          req.app.wsService.broadcastAlert(alert);
        }
        // Also process the reading through the integrated detection engine so historical
        // detections and AI insights populate automatically.
        try {
          integratedEngine.processReading({
            pressure: sensorData.pressure,
            flow: sensorData.flow,
            valve_state: sensorData.valve_state,
            temperature: sensorData.temperature,
            timestamp
          });
        } catch (engErr) {
          console.error('[SENSOR] integratedEngine.processReading failed:', engErr.message || engErr);
        }
      }
    } catch (bErr) {
      console.error('Failed to broadcast sensor update/alert over WebSocket:', bErr);
    }

    res.status(201).json({
      success: true,
      data: responsePayload,
      message: 'Sensor data recorded successfully'
    });
  } catch (error) {
    throw new AppError('Failed to save sensor data', 500);
  }
});

/**
 * GET /api/sensor-data
 * Retrieve historical sensor data with optional time range filtering
 */
const getSensorData = asyncHandler(async (req, res) => {
  const { startTime, endTime, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM sensor_data WHERE 1=1';
  const params = [];

  // Add time range filters
  if (startTime) {
    const start = parseInt(startTime);
    if (isNaN(start)) {
      throw new AppError('Invalid startTime parameter', 400);
    }
    query += ' AND timestamp >= ?';
    params.push(start);
  }

  if (endTime) {
    const end = parseInt(endTime);
    if (isNaN(end)) {
      throw new AppError('Invalid endTime parameter', 400);
    }
    query += ' AND timestamp <= ?';
    params.push(end);
  }

  // Add ordering and pagination
  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  try {
    const rows = await dbAll(query, params);
    const formattedData = rows.map(formatSensorData);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM sensor_data WHERE 1=1';
    const countParams = [];
    
    if (startTime) {
      countQuery += ' AND timestamp >= ?';
      countParams.push(parseInt(startTime));
    }
    if (endTime) {
      countQuery += ' AND timestamp <= ?';
      countParams.push(parseInt(endTime));
    }

    const countResult = await dbGet(countQuery, countParams);

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        total: countResult.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: formattedData.length
      }
    });
  } catch (error) {
    throw new AppError('Failed to retrieve sensor data', 500);
  }
});

/**
 * GET /api/sensor-data/:id
 * Retrieve a specific sensor reading
 */
const getSensorDataById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const row = await dbGet('SELECT * FROM sensor_data WHERE id = ?', [id]);
    
    if (!row) {
      throw new AppError('Sensor data not found', 404);
    }

    res.json({
      success: true,
      data: formatSensorData(row)
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve sensor data', 500);
  }
});

/**
 * GET /api/sensor-data/stats
 * Get statistics of sensor data
 */
const getSensorDataStats = asyncHandler(async (req, res) => {
  const { timeRange = 3600000 } = req.query; // Default 1 hour in ms

  const startTime = getCurrentTimestamp() - parseInt(timeRange);

  try {
    const stats = await dbGet(
      `SELECT 
        COUNT(*) as total_readings,
        AVG(pressure) as avg_pressure,
        MAX(pressure) as max_pressure,
        MIN(pressure) as min_pressure,
        AVG(flow) as avg_flow,
        MAX(flow) as max_flow,
        MIN(flow) as min_flow,
        SUM(CASE WHEN leak_status = 1 THEN 1 ELSE 0 END) as leak_count
       FROM sensor_data WHERE timestamp >= ?`,
      [startTime]
    );

    res.json({
      success: true,
      data: {
        timeRange: parseInt(timeRange),
        statistics: {
          totalReadings: stats.total_readings || 0,
          pressure: {
            average: stats.avg_pressure ? Math.round(stats.avg_pressure * 100) / 100 : 0,
            max: stats.max_pressure || 0,
            min: stats.min_pressure || 0
          },
          flow: {
            average: stats.avg_flow ? Math.round(stats.avg_flow * 100) / 100 : 0,
            max: stats.max_flow || 0,
            min: stats.min_flow || 0
          },
          leakDetected: (stats.leak_count || 0) > 0
        }
      }
    });
  } catch (error) {
    throw new AppError('Failed to calculate statistics', 500);
  }
});

module.exports = {
  addSensorData,
  getSensorData,
  getSensorDataById,
  getSensorDataStats
};

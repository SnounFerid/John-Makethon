const express = require('express');
const router = express.Router();
const {
  addSensorData,
  getSensorData,
  getSensorDataById,
  getSensorDataStats
} = require('../controllers/sensorController');

/**
 * Sensor Data Routes
 * @route POST /api/sensor-data - Add new sensor reading
 * @route GET /api/sensor-data - Get historical sensor data with filters
 * @route GET /api/sensor-data/:id - Get specific sensor reading
 * @route GET /api/sensor-data/stats - Get sensor data statistics
 */

// POST: Add sensor data
router.post('/', addSensorData);

// GET: Retrieve sensor data with optional filters
router.get('/', getSensorData);

// GET: Get sensor data statistics
router.get('/stats', getSensorDataStats);

// GET: Retrieve specific sensor reading
router.get('/:id', getSensorDataById);

module.exports = router;

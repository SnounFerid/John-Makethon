const express = require('express');
const router = express.Router();
const {
  getLeakDetectionStatus,
  getLeakPredictions
} = require('../controllers/leakDetectionController');

/**
 * Leak Detection Routes
 * @route GET /api/leak-detection - Get leak detection status
 * @route GET /api/leak-detection/predictions - Get leak predictions
 */

// Leak Detection
router.get('/', getLeakDetectionStatus);
router.get('/predictions', getLeakPredictions);

module.exports = router;

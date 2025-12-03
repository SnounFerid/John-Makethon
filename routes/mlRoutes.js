const express = require('express');
const router = express.Router();
const {
  trainModel,
  getTrainingStatus,
  getTrainingHistory
} = require('../controllers/mlController');

/**
 * ML Model Training Routes
 * @route POST /api/train-model - Trigger model training
 * @route GET /api/train-model/status - Get training status
 * @route GET /api/train-model/history - Get training history
 */

// POST: Train the model
router.post('/', trainModel);

// GET: Get current training status
router.get('/status', getTrainingStatus);

// GET: Get training history
router.get('/history', getTrainingHistory);

module.exports = router;

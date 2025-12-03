const { dbRun, dbGet, dbAll } = require('../db/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateId, getCurrentTimestamp } = require('../utils/helpers');
const { model } = require('../utils/mlModel');

/**
 * POST /api/train-model
 * Trigger AI model training using historical sensor data
 */
const trainModel = asyncHandler(async (req, res) => {
  // Check if model is already training
  if (model.isTraining) {
    throw new AppError('Model is already being trained. Please wait for training to complete.', 409);
  }

  try {
    // Fetch historical sensor data for training
    const trainingData = await dbAll(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1000'
    );

    if (trainingData.length === 0) {
      throw new AppError('No sensor data available for training', 400);
    }

    // Start model training
    const trainingResult = await model.train(trainingData);

    // Log training event
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    await dbRun(
      `INSERT INTO model_training_logs (id, training_date, accuracy, model_version, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, timestamp, model.accuracy, model.modelVersion, 'COMPLETED']
    );

    res.status(200).json({
      success: true,
      data: {
        ...trainingResult,
        modelInfo: model.getModelInfo()
      },
      message: 'Model training completed successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Model training failed', 500);
  }
});

/**
 * GET /api/train-model/status
 * Get current model training status
 */
const getTrainingStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: model.getModelInfo()
  });
});

/**
 * GET /api/train-model/history
 * Get model training history
 */
const getTrainingHistory = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const history = await dbAll(
      'SELECT * FROM model_training_logs ORDER BY training_date DESC LIMIT ?',
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: history.map(record => ({
        id: record.id,
        trainingDate: record.training_date,
        accuracy: record.accuracy,
        modelVersion: record.model_version,
        status: record.status,
        createdAt: record.created_at
      }))
    });
  } catch (error) {
    throw new AppError('Failed to retrieve training history', 500);
  }
});

module.exports = {
  trainModel,
  getTrainingStatus,
  getTrainingHistory
};

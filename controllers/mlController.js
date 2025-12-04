const fs = require('fs');
const path = require('path');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateId, getCurrentTimestamp } = require('../utils/helpers');
const { model } = require('../utils/mlModel');
const DataPreparationService = require('../backend/scripts/prepareTrainingData');
const { mlDetector } = require('../utils/mlAnomalyDetector');

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
    // Optional body parameter to select data source
    // { source: 'db'|'prepared'|'combined' }
    const source = req.body && req.body.source ? req.body.source : 'db';

    let trainingData = [];

    if (source === 'prepared' || source === 'combined') {
      // Prepare data from backend/training_data and load processed JSON
      const prep = new DataPreparationService();
      await prep.prepareAllData();
      const dataPath = path.join(__dirname, '../backend/training_data/processed/combined_training_data.json');
      if (!fs.existsSync(dataPath)) {
        throw new AppError('Prepared data not found after running preparation step', 500);
      }
      trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    if (source === 'db' || trainingData.length === 0) {
      // Fallback to using recent sensor_data from DB
      const dbData = await dbAll(
        'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 5000'
      );
      if (dbData && dbData.length > 0) {
        // Map DB rows to feature objects expected by mlDetector
        trainingData = dbData.map(row => ({
          pressure: row.pressure,
          flow: row.flow,
          pressure_rate_of_change: row.pressure_rate_of_change,
          flow_rate_of_change: row.flow_rate_of_change,
          pressure_ma_30s: row.pressure_ma_30s,
          flow_ma_30s: row.flow_ma_30s,
          pressure_stddev_60s: row.pressure_stddev_60s,
          flow_stddev_60s: row.flow_stddev_60s,
          pressure_flow_ratio: row.pressure_flow_ratio,
          hour_of_day: row.hour_of_day || new Date(row.timestamp).getHours(),
          is_weekend: row.is_weekend || 0,
          label: row.label || 'normal'
        }));
      }
    }

    if (!trainingData || trainingData.length === 0) {
      throw new AppError('No training data available for training', 400);
    }

    // Use the ML Anomaly Detector for training (Isolation Forest)
    const trainResult = mlDetector.train(trainingData);

    if (!trainResult || !trainResult.success) {
      throw new AppError('ML detector training failed', 500);
    }

    // Save trained model to disk
    mlDetector.saveModel(`custom_trained_model_${getCurrentTimestamp()}.json`);

    // Log training event
    const id = generateId();
    const timestamp = getCurrentTimestamp();

    await dbRun(
      `INSERT INTO model_training_logs (id, training_date, accuracy, model_version, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, timestamp, mlDetector.getModelInfo().metrics ? mlDetector.getModelInfo().metrics.accuracy : null, 'anomaly-detector-v1', 'COMPLETED']
    );

    res.status(200).json({
      success: true,
      data: {
        modelInfo: mlDetector.getModelInfo(),
        trainResult
      },
      message: 'Model training completed successfully (mlDetector)'
    });
  } catch (error) {
    console.error('[ML CONTROLLER] trainModel error:', error.message || error);
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

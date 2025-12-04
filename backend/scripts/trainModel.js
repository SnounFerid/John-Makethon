const fs = require('fs');
const path = require('path');
const { mlDetector } = require('../utils/mlAnomalyDetector');

/**
 * Train ML model with prepared data
 */
async function trainModelWithCustomData() {
  console.log('\n' + '═'.repeat(80));
  console.log('[TRAINING] Starting model training with custom data...');
  console.log('═'.repeat(80) + '\n');

  try {
    // Load prepared data
    const dataPath = path.join(__dirname, '../training_data/processed/combined_training_data.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('Prepared data not found. Run prepareTrainingData.js first.');
    }

    console.log(`[TRAINING] Loading data from: ${dataPath}`);
    const trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log(`[TRAINING] Loaded ${trainingData.length} samples`);

    // Split into train/test (80/20)
    const splitIndex = Math.floor(trainingData.length * 0.8);
    const trainSet = trainingData.slice(0, splitIndex);
    const testSet = trainingData.slice(splitIndex);

    console.log(`[TRAINING] Train set: ${trainSet.length} samples`);
    console.log(`[TRAINING] Test set: ${testSet.length} samples\n`);

    // Train the model
    console.log('[TRAINING] Training Isolation Forest...');
    const trainResult = mlDetector.train(trainSet);

    if (trainResult.success) {
      console.log(`\n[TRAINING] ✓ Training completed in ${trainResult.trainingTime}ms`);

      // Evaluate on test set
      console.log('\n[EVALUATION] Evaluating on test set...');
      const testLabels = testSet.map(d => d.label);
      const { predictions, confusionMatrix } = mlDetector.predictBatch(testSet, testLabels);

      mlDetector.logMetrics();

      // Save the trained model
      const modelSaved = mlDetector.saveModel('custom_trained_model.json');
      
      if (modelSaved) {
        console.log('\n✓ Model saved successfully!');
        console.log('  Location: backend/models/custom_trained_model.json');
      }

      console.log('\n' + '═'.repeat(80));
      console.log('[TRAINING] Training pipeline complete!');
      console.log('═'.repeat(80) + '\n');

      return {
        success: true,
        trainingSamples: trainSet.length,
        testSamples: testSet.length,
        metrics: mlDetector.calculateMetrics()
      };

    } else {
      throw new Error('Training failed');
    }

  } catch (error) {
    console.error('[TRAINING] Error:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  trainModelWithCustomData()
    .then(result => {
      console.log('✓ Training complete!');
      console.log(`  Accuracy: ${result.metrics.accuracy}%`);
      process.exit(0);
    })
    .catch(error => {
      console.error('✗ Training failed:', error);
      process.exit(1);
    });
}

module.exports = trainModelWithCustomData;
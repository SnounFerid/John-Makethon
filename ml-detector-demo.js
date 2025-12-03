/**
 * ML Anomaly Detection System Demo
 * Demonstrates training, prediction, and performance evaluation
 */

const { mlDetector } = require('./utils/mlAnomalyDetector');
const { preprocessor } = require('./utils/dataPreprocessor');
const { simulator, SCENARIOS } = require('./utils/dataSimulator');

/**
 * Example 1: Training with Synthetic Data
 */
async function exampleSyntheticTraining() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 1: TRAINING WITH SYNTHETIC DATA             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  mlDetector.reset();

  // Generate synthetic training data
  const trainingData = mlDetector.createSyntheticTrainingData();

  // Train model
  const trainResult = mlDetector.train(trainingData);

  if (trainResult.success) {
    console.log('[TRAINING RESULT]');
    console.log(`  Success: ✓`);
    console.log(`  Time: ${trainResult.trainingTime}ms`);
    console.log(`  Trees: ${trainResult.modelState.treeCount}`);
    console.log(`  Features: ${trainResult.modelState.features.join(', ')}`);
  }

  // Evaluate on training data
  console.log('\n[EVALUATING ON TRAINING DATA]\n');
  const trueLabels = trainingData.map(d => d.label);
  const { predictions, confusionMatrix } = mlDetector.predictBatch(
    trainingData,
    trueLabels
  );

  mlDetector.logMetrics();

  // Show sample predictions
  console.log('[SAMPLE PREDICTIONS]');
  const samples = [
    { index: 0, label: 'Normal (index 0)' },
    { index: 100, label: 'Normal (index 100)' },
    { index: 500, label: 'Anomaly (index 500)' },
    { index: 600, label: 'Anomaly (index 600)' }
  ];

  samples.forEach(({ index, label }) => {
    const pred = predictions[index];
    console.log(`  ${label}:`);
    console.log(`    Anomaly Score: ${pred.anomalyScore}%`);
    console.log(`    Classification: ${pred.isAnomaly ? 'ANOMALY' : 'NORMAL'}`);
    console.log(`    Confidence: ${pred.confidence}%`);
  });
}

/**
 * Example 2: Real-time Prediction with Simulator
 */
async function exampleRealtimePrediction() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    EXAMPLE 2: REAL-TIME PREDICTION WITH DATA SIMULATOR      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  mlDetector.reset();
  preprocessor.reset();

  // Train on synthetic data first
  console.log('[PHASE 1] Training model on synthetic data...\n');
  const trainingData = mlDetector.createSyntheticTrainingData();
  mlDetector.train(trainingData);

  // Real-time prediction with simulator
  console.log('[PHASE 2] Real-time prediction on simulated data...\n');

  let processedCount = 0;
  let anomaliesDetected = 0;

  simulator.onData((rawData) => {
    const features = preprocessor.processReading({
      id: `realtime_${processedCount}`,
      timestamp: Date.now(),
      ...rawData
    });

    if (features) {
      try {
        const prediction = mlDetector.predict({
          pressure: features.pressure,
          flow: features.flow,
          pressure_rate_of_change: features.pressure_rate_of_change,
          flow_rate_of_change: features.flow_rate_of_change,
          pressure_ma_30s: features.pressure_ma_30s || features.pressure,
          flow_ma_30s: features.flow_ma_30s || features.flow,
          pressure_stddev_60s: features.pressure_stddev_60s || 0.5,
          flow_stddev_60s: features.flow_stddev_60s || 0.3,
          pressure_flow_ratio: features.pressure_flow_ratio,
          hour_of_day: features.hour_of_day,
          is_weekend: features.is_weekend ? 1 : 0
        });

        if (prediction.isAnomaly) {
          anomaliesDetected++;
          console.log(
            `[${processedCount}] ⚠️  ANOMALY DETECTED - Score: ${prediction.anomalyScore}%, Confidence: ${prediction.confidence}%`
          );
        }

        processedCount++;
      } catch (error) {
        console.error(`[ERROR] Prediction failed:`, error.message);
      }
    }
  });

  // Normal operation
  console.log('[SCENARIO 1] Normal operation (8 seconds)...\n');
  simulator.switchScenario(SCENARIOS.NORMAL);
  simulator.start(500);

  await new Promise(resolve => setTimeout(resolve, 8000));
  simulator.stop();

  // Minor leak
  console.log('[SCENARIO 2] Minor leak (8 seconds)...\n');
  simulator.switchScenario(SCENARIOS.MINOR_LEAK);
  simulator.start(500);

  await new Promise(resolve => setTimeout(resolve, 8000));
  simulator.stop();

  // Major leak
  console.log('[SCENARIO 3] Major leak (8 seconds)...\n');
  simulator.switchScenario(SCENARIOS.MAJOR_LEAK);
  simulator.start(500);

  await new Promise(resolve => setTimeout(resolve, 8000));
  simulator.stop();

  console.log(`\n[REAL-TIME PREDICTION SUMMARY]`);
  console.log(`  Total Predictions: ${processedCount}`);
  console.log(`  Anomalies Detected: ${anomaliesDetected}`);
  console.log(`  Detection Rate: ${((anomaliesDetected / processedCount) * 100).toFixed(2)}%`);
}

/**
 * Example 3: Model Saving and Loading
 */
async function exampleModelPersistence() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          EXAMPLE 3: MODEL SAVING AND LOADING                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  mlDetector.reset();

  // Train model
  console.log('[PHASE 1] Training model...\n');
  const trainingData = mlDetector.createSyntheticTrainingData();
  mlDetector.train(trainingData);

  // Evaluate before saving
  const { predictions: predictions1 } = mlDetector.predictBatch(trainingData);
  const anomalyCount1 = predictions1.filter(p => p.isAnomaly).length;

  console.log(`\n[Before Save] Anomalies detected: ${anomalyCount1}`);
  mlDetector.logMetrics();

  // Save model
  console.log('[PHASE 2] Saving model...\n');
  const saved = mlDetector.saveModel('test_model.json');

  if (saved) {
    console.log('[MODEL INFO]');
    const info = mlDetector.getModelInfo();
    console.log(`  Trained: ${info.isTrained}`);
    console.log(`  Trees: ${info.numTrees}`);
    console.log(`  Features: ${info.features.length}`);
    console.log(`  Accuracy: ${info.metrics.accuracy}%`);
  }

  // Reset and load
  console.log('\n[PHASE 3] Resetting and reloading model...\n');
  mlDetector.reset();

  const loaded = mlDetector.loadModel('test_model.json');

  if (loaded) {
    // Evaluate after loading
    const { predictions: predictions2 } = mlDetector.predictBatch(trainingData);
    const anomalyCount2 = predictions2.filter(p => p.isAnomaly).length;

    console.log(`\n[After Load] Anomalies detected: ${anomalyCount2}`);
    console.log(`Consistency check: ${anomalyCount1 === anomalyCount2 ? '✓ PASS' : '✗ FAIL'}`);
    mlDetector.logMetrics();
  }
}

/**
 * Example 4: Feature Importance Analysis
 */
async function exampleFeatureAnalysis() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 4: FEATURE ANALYSIS                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  mlDetector.reset();

  const trainingData = mlDetector.createSyntheticTrainingData();
  mlDetector.train(trainingData);

  const modelInfo = mlDetector.getModelInfo();

  console.log('[FEATURES USED IN MODEL]');
  modelInfo.features.forEach((feature, idx) => {
    const mean = mlDetector.model.featureMeans[feature];
    const stdDev = mlDetector.model.featureStdDevs[feature];

    console.log(`  ${idx + 1}. ${feature}`);
    console.log(`     Mean: ${mean.toFixed(4)}`);
    console.log(`     StdDev: ${stdDev.toFixed(4)}`);
  });

  console.log(`\n[PREDICTION DISTRIBUTION]`);

  // Analyze prediction distribution
  const { predictions } = mlDetector.predictBatch(trainingData);

  const normalScores = predictions
    .filter(p => !p.isAnomaly)
    .map(p => p.anomalyScore);
  const anomalyScores = predictions
    .filter(p => p.isAnomaly)
    .map(p => p.anomalyScore);

  if (normalScores.length > 0) {
    const avgNormal =
      normalScores.reduce((a, b) => a + b, 0) / normalScores.length;
    const minNormal = Math.min(...normalScores);
    const maxNormal = Math.max(...normalScores);

    console.log(`  Normal Samples:`);
    console.log(`    Count: ${normalScores.length}`);
    console.log(`    Avg Score: ${avgNormal.toFixed(2)}%`);
    console.log(`    Range: ${minNormal.toFixed(2)}% - ${maxNormal.toFixed(2)}%`);
  }

  if (anomalyScores.length > 0) {
    const avgAnomaly =
      anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length;
    const minAnomaly = Math.min(...anomalyScores);
    const maxAnomaly = Math.max(...anomalyScores);

    console.log(`  Anomaly Samples:`);
    console.log(`    Count: ${anomalyScores.length}`);
    console.log(`    Avg Score: ${avgAnomaly.toFixed(2)}%`);
    console.log(`    Range: ${minAnomaly.toFixed(2)}% - ${maxAnomaly.toFixed(2)}%`);
  }
}

/**
 * Example 5: Cross-Scenario Testing
 */
async function exampleCrossScenarioTesting() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      EXAMPLE 5: CROSS-SCENARIO TESTING                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  mlDetector.reset();
  preprocessor.reset();

  // Train
  console.log('[TRAINING PHASE]\n');
  const trainingData = mlDetector.createSyntheticTrainingData();
  mlDetector.train(trainingData);

  // Test each scenario
  const scenarios = [
    { name: SCENARIOS.NORMAL, label: 'Normal Operation' },
    { name: SCENARIOS.MINOR_LEAK, label: 'Minor Leak' },
    { name: SCENARIOS.MAJOR_LEAK, label: 'Major Leak' },
    { name: SCENARIOS.PIPE_BURST, label: 'Pipe Burst' }
  ];

  for (const scenario of scenarios) {
    console.log(`\n[TESTING: ${scenario.label}]`);

    let predictions = [];

    simulator.onData((rawData) => {
      const features = preprocessor.processReading({
        id: `test_${predictions.length}`,
        timestamp: Date.now(),
        ...rawData
      });

      if (features) {
        try {
          const pred = mlDetector.predict({
            pressure: features.pressure,
            flow: features.flow,
            pressure_rate_of_change: features.pressure_rate_of_change,
            flow_rate_of_change: features.flow_rate_of_change,
            pressure_ma_30s: features.pressure_ma_30s || features.pressure,
            flow_ma_30s: features.flow_ma_30s || features.flow,
            pressure_stddev_60s: features.pressure_stddev_60s || 0.5,
            flow_stddev_60s: features.flow_stddev_60s || 0.3,
            pressure_flow_ratio: features.pressure_flow_ratio,
            hour_of_day: features.hour_of_day,
            is_weekend: features.is_weekend ? 1 : 0
          });

          predictions.push(pred);
        } catch (error) {
          // Ignore prediction errors
        }
      }
    });

    simulator.switchScenario(scenario.name);
    simulator.start(500);

    await new Promise(resolve => setTimeout(resolve, 6000));
    simulator.stop();

    if (predictions.length > 0) {
      const anomalies = predictions.filter(p => p.isAnomaly).length;
      const avgScore =
        predictions.reduce((sum, p) => sum + p.anomalyScore, 0) / predictions.length;

      console.log(`  Predictions: ${predictions.length}`);
      console.log(`  Anomalies: ${anomalies} (${((anomalies / predictions.length) * 100).toFixed(1)}%)`);
      console.log(`  Avg Score: ${avgScore.toFixed(2)}%`);
      console.log(`  Expected: ${scenario.name === SCENARIOS.NORMAL ? 'NORMAL' : 'ANOMALY'}`);
    }

    preprocessor.reset();
  }

  simulator.reset();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Example 1
    await exampleSyntheticTraining();

    // Example 2
    await exampleRealtimePrediction();

    // Example 3
    await exampleModelPersistence();

    // Example 4
    await exampleFeatureAnalysis();

    // Example 5
    await exampleCrossScenarioTesting();

    mlDetector.reset();
    preprocessor.reset();
    simulator.reset();

    console.log('\n✓ All ML anomaly detector examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
    console.error(error.stack);
  }
}

// Export examples
module.exports = {
  exampleSyntheticTraining,
  exampleRealtimePrediction,
  exampleModelPersistence,
  exampleFeatureAnalysis,
  exampleCrossScenarioTesting,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

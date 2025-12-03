/**
 * Data Preprocessor Demo
 * Shows how to use the DataPreprocessor module with various data scenarios
 */

const { preprocessor } = require('./utils/dataPreprocessor');
const { simulator, SCENARIOS } = require('./utils/dataSimulator');

/**
 * Example 1: Single Reading Processing
 */
function exampleSingleReading() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 1: SINGLE READING PROCESSING                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  const testReadings = [
    { id: '1', timestamp: Date.now(), pressure: 50, flow: 10, leak_status: false, valve_state: 'OPEN' },
    { id: '2', timestamp: Date.now() + 1000, pressure: 50.2, flow: 10.1, leak_status: false, valve_state: 'OPEN' },
    { id: '3', timestamp: Date.now() + 2000, pressure: 50.1, flow: 10.2, leak_status: false, valve_state: 'OPEN' }
  ];

  testReadings.forEach(reading => {
    const features = preprocessor.processReading(reading);
    if (features) {
      console.log('[PROCESSED FEATURES]');
      console.log(`  Raw: P=${features.pressure} PSI, F=${features.flow} L/min`);
      console.log(`  Rates: ΔP=${features.pressure_rate_of_change.toFixed(3)} PSI/s, ΔF=${features.flow_rate_of_change.toFixed(3)} L/min/s`);
      if (features.pressure_ma_30s) {
        console.log(`  MA(30s): P=${features.pressure_ma_30s.toFixed(2)} PSI, F=${features.flow_ma_30s.toFixed(2)} L/min`);
      }
      console.log(`  Time: ${features.day_name} ${features.hour_of_day}:${String(features.minute_of_hour).padStart(2, '0')}`);
      console.log();
    }
  });

  preprocessor.logQualityReport();
}

/**
 * Example 2: Outlier and Invalid Data Detection
 */
function exampleOutlierDetection() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 2: OUTLIER & INVALID DATA DETECTION         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  const testReadings = [
    { id: '1', timestamp: Date.now(), pressure: 50, flow: 10, leak_status: false, valve_state: 'OPEN' },
    { id: '2', timestamp: Date.now() + 1000, pressure: 150, flow: 10, leak_status: false, valve_state: 'OPEN' }, // Outlier
    { id: '3', timestamp: Date.now() + 2000, pressure: 'invalid', flow: 10, leak_status: false, valve_state: 'OPEN' }, // Invalid
    { id: '4', timestamp: Date.now() + 3000, pressure: 45, flow: null, leak_status: false, valve_state: 'OPEN' }, // Missing value
    { id: '5', timestamp: Date.now() + 4000, pressure: 48, flow: 9.5, leak_status: false, valve_state: 'OPEN' } // Valid
  ];

  testReadings.forEach(reading => {
    preprocessor.processReading(reading);
  });

  preprocessor.logQualityReport();
}

/**
 * Example 3: Spike Detection
 */
async function exampleSpikeDetection() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 3: SPIKE DETECTION                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  // Generate normal data first
  const baseTime = Date.now();
  for (let i = 0; i < 20; i++) {
    const features = preprocessor.processReading({
      id: `normal_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 2,
      flow: 10 + (Math.random() - 0.5) * 1,
      leak_status: false,
      valve_state: 'OPEN'
    });
  }

  console.log('[Normal data baseline established]\n');

  // Now inject a spike
  preprocessor.processReading({
    id: 'spike_reading',
    timestamp: baseTime + 21000,
    pressure: 85, // Sudden spike
    flow: 10,
    leak_status: false,
    valve_state: 'OPEN'
  });

  preprocessor.logQualityReport();
}

/**
 * Example 4: Real-time streaming with simulator
 */
async function exampleRealtimeProcessing() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 4: REAL-TIME STREAM PROCESSING              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  let processedCount = 0;
  let spikeCount = 0;

  simulator.onData((rawData) => {
    const features = preprocessor.processReading({
      id: `stream_${processedCount}`,
      timestamp: Date.now(),
      ...rawData
    });

    if (features) {
      processedCount++;
      if (features.pressure_spike_detected || features.flow_spike_detected) {
        spikeCount++;
      }
    }
  });

  simulator.switchScenario(SCENARIOS.NORMAL);
  simulator.start(500); // 500ms interval for demo

  // Let it run for 8 seconds, then switch to leak scenario
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  simulator.switchScenario(SCENARIOS.MINOR_LEAK);
  await new Promise(resolve => setTimeout(resolve, 8000));

  simulator.stop();

  console.log(`\n[PROCESSING SUMMARY]`);
  console.log(`  Total Processed: ${processedCount}`);
  console.log(`  Spikes Detected: ${spikeCount}`);

  const stats = preprocessor.getFeatureStatistics();
  if (stats) {
    console.log(`\n[FEATURE STATISTICS]`);
    console.log(`  Pressure: ${stats.pressure.min}-${stats.pressure.max} PSI (μ=${stats.pressure.mean})`);
    console.log(`  Flow: ${stats.flow.min}-${stats.flow.max} L/min (μ=${stats.flow.mean})`);
    console.log(`  Avg Quality: ${stats.avg_data_quality}`);
  }

  preprocessor.logQualityReport();
}

/**
 * Example 5: Batch Processing
 */
function exampleBatchProcessing() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 5: BATCH PROCESSING                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  // Create a batch of readings
  const batchSize = 50;
  const baseTime = Date.now();
  const readings = [];

  for (let i = 0; i < batchSize; i++) {
    readings.push({
      id: `batch_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 4,
      flow: 10 + (Math.random() - 0.5) * 2,
      leak_status: false,
      valve_state: 'OPEN'
    });
  }

  // Process entire batch
  const processedFeatures = preprocessor.processReadingsBatch(readings);

  console.log(`\n[BATCH RESULTS]`);
  console.log(`  Input: ${batchSize} readings`);
  console.log(`  Output: ${processedFeatures.length} valid feature vectors`);

  preprocessor.logQualityReport();
}

/**
 * Example 6: Feature Export
 */
function exampleFeatureExport() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 6: FEATURE EXPORT                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  // Generate some data
  const baseTime = Date.now();
  for (let i = 0; i < 10; i++) {
    preprocessor.processReading({
      id: `export_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 2,
      flow: 10 + (Math.random() - 0.5) * 1,
      leak_status: false,
      valve_state: 'OPEN'
    });
  }

  // Export features
  const exported = preprocessor.exportFeatures(5); // Last 5

  console.log('[EXPORTED FEATURES (Last 5)]');
  console.log(JSON.stringify(exported, null, 2));
}

/**
 * Example 7: Data Quality Score Over Time
 */
function exampleDataQualityTracking() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 7: DATA QUALITY TRACKING                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  preprocessor.reset();

  const baseTime = Date.now();
  const qualityScores = [];

  // Generate 30 readings with varying quality
  for (let i = 0; i < 30; i++) {
    // Inject some outliers randomly
    let pressure = 50 + (Math.random() - 0.5) * 2;
    if (Math.random() < 0.1) {
      pressure = Math.random() * 150; // Random outlier
    }

    const features = preprocessor.processReading({
      id: `quality_${i}`,
      timestamp: baseTime + i * 1000,
      pressure,
      flow: 10 + (Math.random() - 0.5) * 1,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      qualityScores.push(features.data_quality_score);
    }
  }

  console.log('[DATA QUALITY SCORES]');
  qualityScores.forEach((score, idx) => {
    const bar = '█'.repeat(Math.round(score * 20));
    console.log(`  Record ${String(idx + 1).padStart(2)}: ${bar} ${(score * 100).toFixed(0)}%`);
  });

  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  console.log(`\n  Average Quality: ${(avgQuality * 100).toFixed(2)}%`);

  preprocessor.logQualityReport();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Example 1
    exampleSingleReading();

    // Example 2
    exampleOutlierDetection();

    // Example 3
    await exampleSpikeDetection();

    // Example 4
    await exampleRealtimeProcessing();

    // Example 5
    exampleBatchProcessing();

    // Example 6
    exampleFeatureExport();

    // Example 7
    exampleDataQualityTracking();

    preprocessor.reset();
    simulator.reset();

    console.log('\n✓ All preprocessor examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples
module.exports = {
  exampleSingleReading,
  exampleOutlierDetection,
  exampleSpikeDetection,
  exampleRealtimeProcessing,
  exampleBatchProcessing,
  exampleFeatureExport,
  exampleDataQualityTracking,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

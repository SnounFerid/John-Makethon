/**
 * Rule-Based Leak Detector Demo
 * Demonstrates all detection rules and probability scoring
 */

const { leakDetector } = require('./utils/leakDetector');
const { preprocessor } = require('./utils/dataPreprocessor');
const { simulator, SCENARIOS } = require('./utils/dataSimulator');

/**
 * Example 1: Normal Operation (No Leaks)
 */
async function exampleNormalOperation() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 1: NORMAL OPERATION - NO LEAKS              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  // Set baseline
  leakDetector.setBaseline(50, 10);

  const baseTime = Date.now();
  for (let i = 0; i < 15; i++) {
    const features = preprocessor.processReading({
      id: `normal_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 1,
      flow: 10 + (Math.random() - 0.5) * 0.5,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      const result = leakDetector.evaluate(features);
      if (i % 5 === 0) {
        leakDetector.logDetectionResult(result);
      }
    }
  }

  leakDetector.logStatistics();
}

/**
 * Example 2: Critical Leak (Sudden Pressure Drop >15% in <60s)
 */
async function exampleCriticalLeak() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    EXAMPLE 2: CRITICAL LEAK - SUDDEN PRESSURE DROP >15%     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  leakDetector.setBaseline(50, 10);

  const baseTime = Date.now();

  // Normal operation first
  console.log('[PHASE 1] Establishing normal baseline...\n');
  for (let i = 0; i < 10; i++) {
    const features = preprocessor.processReading({
      id: `critical_baseline_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 0.5,
      flow: 10 + (Math.random() - 0.5) * 0.3,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      leakDetector.evaluate(features);
    }
  }

  // Sudden pressure drop
  console.log('[PHASE 2] Simulating sudden pressure drop...\n');
  for (let i = 10; i < 20; i++) {
    let pressure;
    if (i === 15) {
      // Sudden drop of 20%
      pressure = 40;
    } else if (i > 15) {
      pressure = 40 + (Math.random() - 0.5) * 1;
    } else {
      pressure = 50 + (Math.random() - 0.5) * 0.5;
    }

    const features = preprocessor.processReading({
      id: `critical_drop_${i}`,
      timestamp: baseTime + i * 1000,
      pressure,
      flow: 10 + (Math.random() - 0.5) * 0.3,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      const result = leakDetector.evaluate(features);
      if (result.is_leak_detected) {
        leakDetector.logDetectionResult(result);
      }
    }
  }

  leakDetector.logStatistics();
}

/**
 * Example 3: Minor Leak (Gradual Pressure Drop 5-15% over 5 minutes)
 */
async function exampleMinorLeak() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    EXAMPLE 3: MINOR LEAK - GRADUAL PRESSURE DROP 5-15%      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  leakDetector.setBaseline(50, 10);

  const baseTime = Date.now();
  let pressure = 50;

  // Simulate gradual pressure drop over 5 minutes
  for (let i = 0; i < 30; i++) {
    // Gradually decrease pressure (small drop per reading)
    const dropRate = 0.33; // ~10% drop over 30 readings
    pressure = Math.max(42, pressure - dropRate + (Math.random() - 0.5) * 0.3);

    const features = preprocessor.processReading({
      id: `minor_leak_${i}`,
      timestamp: baseTime + i * 10000, // 10 second intervals
      pressure,
      flow: 10 + (Math.random() - 0.5) * 0.5,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      const result = leakDetector.evaluate(features);
      if (i % 10 === 0) {
        leakDetector.logDetectionResult(result);
      }
    }
  }

  leakDetector.logStatistics();
}

/**
 * Example 4: Flow-Pressure Mismatch (Flow up >25% while Pressure down)
 */
async function exampleFlowPressureMismatch() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 4: FLOW-PRESSURE MISMATCH - ABNORMAL CORRELATION   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  leakDetector.setBaseline(50, 10);

  const baseTime = Date.now();

  // Normal operation
  console.log('[PHASE 1] Normal operation...\n');
  for (let i = 0; i < 10; i++) {
    const features = preprocessor.processReading({
      id: `mismatch_normal_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 0.5,
      flow: 10 + (Math.random() - 0.5) * 0.3,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      leakDetector.evaluate(features);
    }
  }

  // Mismatch: flow increases while pressure decreases
  console.log('[PHASE 2] Anomalous flow-pressure behavior detected...\n');
  for (let i = 10; i < 20; i++) {
    const pressure = 50 - (i - 10) * 0.8; // Pressure decreasing
    const flow = 10 + (i - 10) * 0.4; // Flow increasing

    const features = preprocessor.processReading({
      id: `mismatch_anomaly_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: Math.max(35, pressure),
      flow: Math.min(15, flow),
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      const result = leakDetector.evaluate(features);
      if (result.is_leak_detected) {
        leakDetector.logDetectionResult(result);
      }
    }
  }

  leakDetector.logStatistics();
}

/**
 * Example 5: Ratio Anomaly (P/F Ratio deviates >30% from baseline)
 */
async function exampleRatioAnomaly() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     EXAMPLE 5: RATIO ANOMALY - P/F DEVIATION >30%           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  leakDetector.setBaseline(50, 10); // Baseline ratio = 5.0

  const baseTime = Date.now();

  // Normal operation
  console.log('[PHASE 1] Normal baseline...\n');
  for (let i = 0; i < 10; i++) {
    const features = preprocessor.processReading({
      id: `ratio_normal_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 1,
      flow: 10 + (Math.random() - 0.5) * 0.5,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      leakDetector.evaluate(features);
    }
  }

  // Anomalous ratio
  console.log('[PHASE 2] Anomalous pressure-to-flow ratio detected...\n');
  for (let i = 10; i < 25; i++) {
    // High flow with normal pressure (ratio decreases)
    const pressure = 50 + (Math.random() - 0.5) * 1;
    const flow = 15 + (Math.random() - 0.5) * 2; // Much higher than baseline

    const features = preprocessor.processReading({
      id: `ratio_anomaly_${i}`,
      timestamp: baseTime + i * 1000,
      pressure,
      flow,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      const result = leakDetector.evaluate(features);
      if (result.is_leak_detected) {
        leakDetector.logDetectionResult(result);
      }
    }
  }

  leakDetector.logStatistics();
}

/**
 * Example 6: Real-time Streaming with Data Simulator
 */
async function exampleRealtimeDetection() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 6: REAL-TIME LEAK DETECTION                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  let processedCount = 0;

  simulator.onData((rawData) => {
    const features = preprocessor.processReading({
      id: `stream_${processedCount}`,
      timestamp: Date.now(),
      ...rawData
    });

    if (features) {
      // Set baseline on first normal reading
      if (processedCount === 0 && !rawData.leak_status) {
        leakDetector.setBaseline(features.pressure, features.flow);
      }

      const result = leakDetector.evaluate(features);
      processedCount++;

      // Log detection results
      if (result.is_leak_detected) {
        leakDetector.logDetectionResult(result);
      }
    }
  });

  // Normal operation
  console.log('[PHASE 1] Normal operation (10 seconds)...\n');
  simulator.switchScenario(SCENARIOS.NORMAL);
  simulator.start(500);

  await new Promise(resolve => setTimeout(resolve, 10000));
  simulator.stop();

  // Minor leak
  console.log('[PHASE 2] Introducing minor leak (10 seconds)...\n');
  leakDetector.reset(); // Reset detector for new scenario
  simulator.switchScenario(SCENARIOS.MINOR_LEAK);
  simulator.start(500);

  await new Promise(resolve => setTimeout(resolve, 10000));
  simulator.stop();

  // Major leak
  console.log('[PHASE 3] Triggering major leak (8 seconds)...\n');
  leakDetector.reset();
  simulator.switchScenario(SCENARIOS.MAJOR_LEAK);
  simulator.start(500);

  await new Promise(resolve => setTimeout(resolve, 8000));
  simulator.stop();

  leakDetector.logStatistics();
}

/**
 * Example 7: Multiple Rules Triggering Simultaneously
 */
async function exampleMultipleRulesTrigger() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 7: MULTIPLE RULES TRIGGERING - COMPOUND DETECTION  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  leakDetector.reset();
  preprocessor.reset();

  leakDetector.setBaseline(50, 10);

  const baseTime = Date.now();

  // Establish baseline
  for (let i = 0; i < 15; i++) {
    const features = preprocessor.processReading({
      id: `compound_baseline_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: 50 + (Math.random() - 0.5) * 0.5,
      flow: 10 + (Math.random() - 0.5) * 0.3,
      leak_status: false,
      valve_state: 'OPEN'
    });

    if (features) {
      leakDetector.evaluate(features);
    }
  }

  // Catastrophic event: Multiple anomalies at once
  console.log('[PHASE 2] Catastrophic event - multiple anomalies...\n');
  for (let i = 15; i < 25; i++) {
    // Sudden pressure drop + flow increase
    const pressure = 50 - (i - 15) * 1.5; // 15 PSI drop in 10 steps
    const flow = 10 + (i - 15) * 0.8; // Flow increasing

    const features = preprocessor.processReading({
      id: `compound_anomaly_${i}`,
      timestamp: baseTime + i * 1000,
      pressure: Math.max(25, pressure),
      flow: Math.min(18, flow),
      leak_status: true,
      valve_state: 'OPEN'
    });

    if (features) {
      const result = leakDetector.evaluate(features);
      leakDetector.logDetectionResult(result);
    }
  }

  leakDetector.logStatistics();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Example 1
    await exampleNormalOperation();

    // Example 2
    await exampleCriticalLeak();

    // Example 3
    await exampleMinorLeak();

    // Example 4
    await exampleFlowPressureMismatch();

    // Example 5
    await exampleRatioAnomaly();

    // Example 6
    await exampleRealtimeDetection();

    // Example 7
    await exampleMultipleRulesTrigger();

    leakDetector.reset();
    preprocessor.reset();
    simulator.reset();

    console.log('\n✓ All leak detector examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples
module.exports = {
  exampleNormalOperation,
  exampleCriticalLeak,
  exampleMinorLeak,
  exampleFlowPressureMismatch,
  exampleRatioAnomaly,
  exampleRealtimeDetection,
  exampleMultipleRulesTrigger,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

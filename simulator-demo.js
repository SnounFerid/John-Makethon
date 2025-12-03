/**
 * Data Simulator Demo
 * Shows how to use the DataSimulator module with different scenarios
 */

const { simulator, SCENARIOS } = require('./utils/dataSimulator');

/**
 * Example 1: Normal Operation
 */
async function exampleNormalOperation() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 1: NORMAL OPERATION                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  simulator.onData((data) => {
    // In a real app, this would send data to the API
    // console.log('Received data:', data);
  });

  simulator.switchScenario(SCENARIOS.NORMAL);
  simulator.start(1000); // Generate data every 1 second

  // Let it run for 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  simulator.stop();
}

/**
 * Example 2: Minor Leak Detection
 */
async function exampleMinorLeak() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 2: MINOR LEAK SCENARIO                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  simulator.switchScenario(SCENARIOS.MINOR_LEAK);
  simulator.start(1000);

  // Let it run for 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));
  simulator.stop();
}

/**
 * Example 3: Major Leak with Anomaly Injection
 */
async function exampleMajorLeakWithAnomalies() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 3: MAJOR LEAK WITH ANOMALIES                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  simulator.switchScenario(SCENARIOS.MAJOR_LEAK);
  simulator.start(1000);

  // After 5 seconds, inject a pressure spike anomaly
  await new Promise(resolve => setTimeout(resolve, 5000));
  simulator.injectAnomaly('PRESSURE_SPIKE', 15, 3000);

  // Let it run for another 12 seconds
  await new Promise(resolve => setTimeout(resolve, 12000));
  simulator.stop();
}

/**
 * Example 4: Pipe Burst Scenario
 */
async function examplePipeBurst() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 4: PIPE BURST SCENARIO                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  simulator.switchScenario(SCENARIOS.PIPE_BURST);
  simulator.start(800); // Faster generation for burst scenario

  // Let it run for 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  simulator.stop();
}

/**
 * Example 5: Scenario Switching and Multiple Anomalies
 */
async function exampleComplexScenario() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 5: COMPLEX SCENARIO - MULTIPLE TRANSITIONS   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  simulator.switchScenario(SCENARIOS.NORMAL);
  simulator.start(1000);

  // Run normal for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Switch to minor leak
  simulator.switchScenario(SCENARIOS.MINOR_LEAK);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Inject a flow spike
  simulator.injectAnomaly('FLOW_SPIKE', 20, 4000);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Switch to major leak
  simulator.switchScenario(SCENARIOS.MAJOR_LEAK);
  await new Promise(resolve => setTimeout(resolve, 8000));

  simulator.stop();
}

/**
 * Example 6: Data Callback Integration (Simulating API calls)
 */
async function exampleWithDataCallback() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 6: DATA CALLBACK INTEGRATION                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let dataPointsReceived = 0;
  let leakDetectionCount = 0;

  simulator.onData((data) => {
    dataPointsReceived++;
    if (data.leak_status) {
      leakDetectionCount++;
    }

    // Simulate sending to API (commented out)
    // console.log('[API] Sending sensor data:', data);
  });

  simulator.switchScenario(SCENARIOS.NORMAL);
  simulator.start(1000);

  await new Promise(resolve => setTimeout(resolve, 3000));

  simulator.switchScenario(SCENARIOS.MINOR_LEAK);
  await new Promise(resolve => setTimeout(resolve, 5000));

  simulator.stop();

  console.log(`\n[STATS] Total data points received: ${dataPointsReceived}`);
  console.log(`[STATS] Leak detections: ${leakDetectionCount}`);
  console.log(`[STATS] Leak detection rate: ${((leakDetectionCount / dataPointsReceived) * 100).toFixed(2)}%\n`);
}

/**
 * Example 7: Get Simulator State
 */
function exampleGetState() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 7: SIMULATOR STATE INSPECTION                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const state = simulator.getState();
  console.log('[SIMULATOR STATE]');
  console.log(`  Running: ${state.isRunning}`);
  console.log(`  Scenario: ${state.currentScenario}`);
  console.log(`  Pressure: ${state.currentPressure} PSI`);
  console.log(`  Flow: ${state.currentFlow} L/min`);
  console.log(`  Step: ${state.simulationStep}`);
  console.log(`  Generated Points: ${state.generatedDataCount}`);
  console.log(`  Active Anomalies: ${state.activeAnomalies}\n`);

  console.log('[AVAILABLE SCENARIOS]');
  simulator.getAvailableScenarios().forEach((scenario, index) => {
    console.log(`  ${index + 1}. ${scenario}`);
  });
  console.log();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Example 1
    await exampleNormalOperation();

    // Example 2
    await exampleMinorLeak();

    // Example 3
    await exampleMajorLeakWithAnomalies();

    // Example 4
    await examplePipeBurst();

    // Example 5
    await exampleComplexScenario();

    // Example 6
    await exampleWithDataCallback();

    // Example 7
    exampleGetState();

    // Cleanup
    simulator.reset();

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples for use in other modules
module.exports = {
  exampleNormalOperation,
  exampleMinorLeak,
  exampleMajorLeakWithAnomalies,
  examplePipeBurst,
  exampleComplexScenario,
  exampleWithDataCallback,
  exampleGetState,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

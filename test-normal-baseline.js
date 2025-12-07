#!/usr/bin/env node

/**
 * Test normal baseline detection
 * Verify that corrected NORMAL scenario (21 L/min avg) gives low probability
 */

const { simulator, SCENARIOS } = require('./utils/dataSimulator');
const { integratedEngine } = require('./utils/integratedEngine');

console.log('Testing normal baseline detection after flow correction...\n');

// Initialize engine
integratedEngine.initializeRuleBasedDetection(50, 21);
integratedEngine.initializeMLDetection();
integratedEngine.initializePredictiveMaintenance();

// Generate and test 20 normal samples
simulator.switchScenario(SCENARIOS.NORMAL);

const results = [];

for (let i = 0; i < 20; i++) {
  simulator.start(100);
  
  setTimeout(() => {
    // Get next sample
    const state = simulator.getState();
    const sample = {
      pressure: state.currentPressure,
      flow: state.currentFlow,
      temperature: state.currentTemperature,
      conductivity: 200
    };
    
    const detection = integratedEngine.processReading(sample);
    
    if (detection) {
      results.push({
        sample: `${i + 1}`,
        pressure: sample.pressure.toFixed(1),
        flow: sample.flow.toFixed(1),
        ml_probability: (detection.detectionResultSummary.detectionMethods[1]?.probability || 0).toFixed(1),
        overall_probability: detection.detectionResultSummary.overallProbability
      });
    }
  }, (i + 1) * 100);
}

setTimeout(() => {
  simulator.stop();
  
  console.log('\n📊 NORMAL SCENARIO TEST RESULTS (corrected baseline):');
  console.log('===========================================================');
  console.table(results);
  
  const avgML = results.reduce((sum, r) => sum + parseFloat(r.ml_probability), 0) / results.length;
  const avgOverall = results.reduce((sum, r) => sum + r.overall_probability, 0) / results.length;
  
  console.log(`\n📈 Statistics:`);
  console.log(`   Average ML Probability: ${avgML.toFixed(1)}%`);
  console.log(`   Average Overall Probability: ${avgOverall.toFixed(1)}%`);
  
  if (avgOverall < 40) {
    console.log('\n✅ GOOD: Normal scenario shows LOW probability (< 40%)');
  } else {
    console.log('\n⚠️  WARNING: Normal scenario still shows HIGH probability');
  }
  
  process.exit(0);
}, 2500);

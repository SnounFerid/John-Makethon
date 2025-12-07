#!/usr/bin/env node

/**
 * Dual AI System Test & Demo
 * Tests LSTM + Regression models with real-time simulation
 */

const { DualAIDetectionSystem } = require('../utils/dualAIDetector');
const { simulator, SCENARIOS } = require('../utils/dataSimulator');

console.log('🔬 DUAL AI SYSTEM TEST & DEMO');
console.log('═'.repeat(80));
console.log('Testing LSTM Anomaly Detection + Regression Predictive Maintenance\n');

// Initialize system
const dualAI = new DualAIDetectionSystem();
const loaded = dualAI.loadModels();

if (!loaded) {
  console.error('❌ Failed to load models. Run: node tools/trainDualAIModels.js');
  process.exit(1);
}

console.log('✅ Models loaded successfully\n');

// Test scenarios
const scenarios = [
  { name: 'NORMAL', type: SCENARIOS.NORMAL, samples: 15 },
  { name: 'MINOR_LEAK', type: SCENARIOS.MINOR_LEAK, samples: 15 },
  { name: 'MAJOR_LEAK', type: SCENARIOS.MAJOR_LEAK, samples: 15 },
  { name: 'PIPE_BURST', type: SCENARIOS.PIPE_BURST, samples: 15 }
];

async function runTest() {
  for (const scenario of scenarios) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📋 SCENARIO: ${scenario.name.toUpperCase()}`);
    console.log(`${'─'.repeat(80)}`);

    simulator.switchScenario(scenario.type);
    simulator.start(600);

    const results = [];
    let processed = 0;

    return new Promise(resolve => {
      const testInterval = setInterval(() => {
        const state = simulator.getState();
        const reading = {
          pressure: state.currentPressure,
          flow: state.currentFlow,
          temperature: state.currentTemperature,
          conductivity: state.conductivity || 200,
          wear: 0
        };

        const detection = dualAI.processReading(reading);

        if (detection && detection.hasEnoughData) {
          results.push({
            p: reading.pressure.toFixed(1),
            f: reading.flow.toFixed(1),
            lstm: detection.lstm ? `${detection.lstm.anomalyPercent}%` : 'BUFFERING',
            reg: detection.regression ? `${detection.regression.leakRiskPercent}%` : 'N/A',
            combined: detection.combined ? `${detection.combined.combinedLeakProbability}%` : 'N/A',
            severity: detection.combined ? detection.combined.severity : '-'
          });
          processed++;
        }

        if (processed >= scenario.samples) {
          clearInterval(testInterval);
          simulator.stop();

          if (results.length > 0) {
            console.log('\n📊 Results:');
            console.table(results);

            // Statistics
            const lstmScores = results.map(r => parseInt(r.lstm)).filter(v => !isNaN(v));
            const regScores = results.map(r => parseInt(r.reg)).filter(v => !isNaN(v));
            const combScores = results.map(r => parseInt(r.combined)).filter(v => !isNaN(v));

            const avg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 'N/A';
            const max = (arr) => arr.length > 0 ? Math.max(...arr) : 'N/A';

            console.log('\n📈 Statistics:');
            console.log(`  LSTM      - Avg: ${avg(lstmScores)}%  Max: ${max(lstmScores)}%`);
            console.log(`  Regression- Avg: ${avg(regScores)}%  Max: ${max(regScores)}%`);
            console.log(`  Combined  - Avg: ${avg(combScores)}%  Max: ${max(combScores)}%`);

            // Analysis
            const combinedAvg = parseFloat(avg(combScores));
            let analysis = '';
            if (scenario.name === 'NORMAL' && combinedAvg < 40) {
              analysis = '✅ GOOD: Normal operation detected correctly';
            } else if (scenario.name === 'NORMAL' && combinedAvg >= 40) {
              analysis = '⚠️  WARNING: False positive in normal operation';
            } else if (scenario.name !== 'NORMAL' && combinedAvg >= 60) {
              analysis = '✅ GOOD: Anomaly/leak detected correctly';
            } else if (scenario.name !== 'NORMAL' && combinedAvg < 60) {
              analysis = '⚠️  WARNING: Leak not detected strongly enough';
            }

            console.log(`\n🔍 Analysis: ${analysis}`);
          }

          resolve();
        }
      }, 300);
    });
  }
}

// Run tests
runTest().then(() => {
  console.log(`\n${'═'.repeat(80)}`);
  console.log('✅ DUAL AI SYSTEM TEST COMPLETE');
  console.log('═'.repeat(80));
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

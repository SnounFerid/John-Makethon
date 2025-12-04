#!/usr/bin/env node

/**
 * simulatePipes.js
 * Interactive simulator that sends generated sensor data to the backend REST API
 * - Uses `utils/dataSimulator.js` for realistic scenarios
 * - Sends each generated data point to POST /api/sensor-data
 * - Provides an interactive CLI to switch scenarios and inject anomalies
 *
 * Usage:
 *  node tools/simulatePipes.js
 *
 * Commands:
 *  start [intervalMs]        Start the simulator (default interval 1000ms)
 *  stop                     Stop the simulator
 *  scenario <NAME>          Switch scenario: NORMAL, MINOR_LEAK, MAJOR_LEAK, PIPE_BURST
 *  inject <TYPE> <mag> <dur_ms>  Inject anomaly: PRESSURE_SPIKE, PRESSURE_DROP, FLOW_SPIKE, FLOW_DROP
 *  status                   Print simulator state
 *  help                     Show this help
 *  quit                     Exit
 */

const { simulator, SCENARIOS } = require('../utils/dataSimulator');
const readline = require('readline');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const SENSOR_ENDPOINT = `${BACKEND_URL}/api/sensor-data`;

console.log('\n[SIMULATOR-CLI] Starting pipe simulator (proof-of-concept)');
console.log(`[SIMULATOR-CLI] Backend API: ${SENSOR_ENDPOINT}`);
console.log("Type 'help' for available commands. Starting simulator in NORMAL scenario (1s interval).\n");

let intervalMs = 1000;
let isPosting = true;

// Register callback to post data to backend
simulator.onData(async (data) => {
  if (!isPosting) return;

  // Build payload using all generated data fields so frontend and backend receive temperature, etc.
  const payload = {
    ...data,
    valve_state: data.valve_state || 'OPEN'
  };

  try {
    // Use global fetch (Node 18+) - falls back to require('node-fetch') if not available
    if (typeof fetch === 'undefined') {
      // eslint-disable-next-line global-require
      global.fetch = require('node-fetch');
    }

    const resp = await fetch(SENSOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.warn(`[SIMULATOR-CLI] POST failed: ${resp.status} - ${text}`);
    } else {
      // Optionally parse and show small confirmation
      const json = await resp.json();
      console.log(`[SIMULATOR-CLI] Sent: p=${payload.pressure} f=${payload.flow} -> saved id=${json.data?.id || 'n/a'}`);
    }
  } catch (err) {
    console.error('[SIMULATOR-CLI] Error posting sensor data:', err.message || err);
  }
});

// Start default
simulator.switchScenario(SCENARIOS.NORMAL);
simulator.start(intervalMs);

// CLI setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'sim> '
});

function showHelp() {
  console.log(`\nAvailable commands:
  start [intervalMs]            Start simulation (default 1000ms)
  stop                          Stop simulation
  scenario <NAME>               Switch scenario: ${Object.values(SCENARIOS).join(', ')}
  inject <TYPE> <mag> <dur_ms>  Inject anomaly: PRESSURE_SPIKE, PRESSURE_DROP, FLOW_SPIKE, FLOW_DROP
  nopost                        Toggle sending to backend (useful to inspect simulator locally)
  status                        Show simulator state
  reset                         Reset simulator to defaults
  help                          Show this help
  quit                          Exit
`);
}

function showStatus() {
  const state = simulator.getState();
  console.log('\n[SIMULATOR STATUS]');
  console.log(`  Running: ${state.isRunning}`);
  console.log(`  Scenario: ${state.currentScenario}`);
  console.log(`  Pressure: ${state.currentPressure} PSI`);
  console.log(`  Flow: ${state.currentFlow} L/min`);
  console.log(`  Step: ${state.simulationStep}`);
  console.log(`  Generated: ${state.generatedDataCount}`);
  console.log(`  Active anomalies: ${state.activeAnomalies}\n`);
}

rl.on('line', async (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }

  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case 'start': {
      const ms = parts[1] ? parseInt(parts[1], 10) : intervalMs;
      if (isNaN(ms) || ms <= 0) {
        console.log('[SIMULATOR-CLI] Invalid interval, using 1000ms');
        simulator.start(1000);
      } else {
        intervalMs = ms;
        simulator.start(intervalMs);
      }
      break;
    }
    case 'stop': {
      simulator.stop();
      break;
    }
    case 'scenario': {
      // This simulator CLI is intentionally limited to NORMAL operation only
      console.log('[SIMULATOR-CLI] Scenario switching disabled in this tool. Use tools/simulateLeak.js for leak scenarios.');
      break;
    }
    case 'inject': {
      // Anomaly injection disabled in the normal-only simulator. Use simulateLeak for controlled anomalies.
      console.log('[SIMULATOR-CLI] Anomaly injection disabled. Use tools/simulateLeak.js to run leak scenarios.');
      break;
    }
    case 'nopost': {
      isPosting = !isPosting;
      console.log(`[SIMULATOR-CLI] Posting to backend: ${isPosting}`);
      break;
    }
    case 'status': {
      showStatus();
      break;
    }
    case 'reset': {
      simulator.reset();
      break;
    }
    case 'help': {
      showHelp();
      break;
    }
    case 'quit':
    case 'exit': {
      console.log('[SIMULATOR-CLI] Exiting...');
      try { simulator.stop(); } catch (e) {}
      rl.close();
      process.exit(0);
      break;
    }
    default:
      console.log(`[SIMULATOR-CLI] Unknown command: ${cmd}`);
      showHelp();
  }

  rl.prompt();
}).on('close', () => {
  console.log('\n[SIMULATOR-CLI] Goodbye');
  process.exit(0);
});

// Initial prompt
rl.prompt();

// Graceful shutdown on SIGINT
process.on('SIGINT', () => {
  console.log('\n[SIMULATOR-CLI] Caught SIGINT, stopping simulator');
  try { simulator.stop(); } catch (e) {}
  process.exit(0);
});

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

console.log('\n════════════════════════════════════════════════════════════════════════════════');
console.log('[SIMULATOR] 🟢 NORMAL CONDITIONS SIMULATOR - No Leaks');
console.log(`[SIMULATOR] Backend API: ${SENSOR_ENDPOINT}`);
console.log('[SIMULATOR] Generating realistic sensor data for a healthy water system');
console.log('════════════════════════════════════════════════════════════════════════════════');
console.log("Type 'help' for available commands. Press Ctrl+C to exit.\n");

let intervalMs = 1000;
let isPosting = true;
let dataCount = 0;

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
      console.warn(`[SIMULATOR] ❌ POST failed: ${resp.status} - ${text}`);
    } else {
      // Show confirmation with leak probability indicator
      const json = await resp.json();
      dataCount++;
      const prob = json.data?.detection?.overallProbability || 0;
      const status = prob < 35 ? '✅ NORMAL' : prob < 50 ? '🟡 WARNING' : prob < 65 ? '🟠 ALERT' : '🔴 CRITICAL';
      console.log(`[SIMULATOR] #${dataCount} - Pressure: ${payload.pressure} PSI | Flow: ${payload.flow} L/min | Probability: ${prob}% ${status}`);
    }
  } catch (err) {
    console.error('[SIMULATOR] Error posting sensor data:', err.message || err);
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
  console.log(`
════════════════════════════════════════════════════════════════════════════════
NORMAL CONDITIONS SIMULATOR - Available Commands
════════════════════════════════════════════════════════════════════════════════
  
  start [intervalMs]            Start sending sensor data (default 1000ms per reading)
  stop                          Pause sending data
  interval <ms>                 Change interval between readings (e.g., interval 500)
  nopost                        Toggle sending to backend (test simulator locally)
  status                        Show current simulator state
  reset                         Reset simulator to defaults
  help                          Show this help
  quit / exit                   Stop and exit
  
📊 SCENARIO INFO:
  This simulator runs in NORMAL conditions with NO LEAKS
  - Pressure: 50 ± 2 PSI (stable)
  - Flow: 21 ± 1 L/min (stable)
  - Temperature: 20°C
  - Conductivity: 200 µS/cm
  
  Expected: Low leak probability (< 35%)
  
  For leak testing, use: node tools/simulateLeak.js <scenario> <count> <interval>
  - Scenarios: normal, minor, major, burst
  
════════════════════════════════════════════════════════════════════════════════
`);
}

function showStatus() {
  const state = simulator.getState();
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('[SIMULATOR STATUS]');
  console.log(`  Status:              ${state.isRunning ? '▶️  RUNNING' : '⏸️  STOPPED'}`);
  console.log(`  Scenario:            ${state.currentScenario} (NO LEAKS - NORMAL CONDITIONS)`);
  console.log(`  Current Pressure:    ${state.currentPressure} PSI (normal: 48-52)`);
  console.log(`  Current Flow:        ${state.currentFlow} L/min (normal: 20-22)`);
  console.log(`  Simulation Step:     ${state.simulationStep}`);
  console.log(`  Data Points Sent:    ${dataCount}`);
  console.log(`  Backend Posting:     ${isPosting ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Active Anomalies:    ${state.activeAnomalies || 'None'}`);
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
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
        console.log('[SIMULATOR] Invalid interval, using 1000ms');
        simulator.start(1000);
        intervalMs = 1000;
      } else {
        intervalMs = ms;
        simulator.start(intervalMs);
        console.log(`[SIMULATOR] ▶️  Started - sending data every ${intervalMs}ms`);
      }
      break;
    }
    case 'stop': {
      simulator.stop();
      console.log('[SIMULATOR] ⏸️  Stopped - no more data being sent');
      break;
    }
    case 'interval': {
      const ms = parts[1] ? parseInt(parts[1], 10) : null;
      if (!ms || isNaN(ms) || ms <= 0) {
        console.log('[SIMULATOR] Invalid interval. Usage: interval <milliseconds>');
      } else {
        intervalMs = ms;
        simulator.stop();
        simulator.start(intervalMs);
        console.log(`[SIMULATOR] ⏱️  Interval set to ${intervalMs}ms`);
      }
      break;
    }
    case 'scenario': {
      // This simulator CLI is intentionally limited to NORMAL operation only
      console.log('[SIMULATOR] 🚫 Scenario switching disabled in this tool.');
      console.log('[SIMULATOR] This tool runs NORMAL conditions ONLY (no leaks).');
      console.log('[SIMULATOR] For leak scenarios, use: node tools/simulateLeak.js <scenario> <count> <interval>');
      break;
    }
    case 'inject': {
      // Anomaly injection disabled in the normal-only simulator. Use simulateLeak for controlled anomalies.
      console.log('[SIMULATOR] 🚫 Anomaly injection disabled in NORMAL simulator.');
      console.log('[SIMULATOR] Use tools/simulateLeak.js to test leak detection scenarios.');
      break;
    }
    case 'nopost': {
      isPosting = !isPosting;
      console.log(`[SIMULATOR] Backend posting: ${isPosting ? '✅ Enabled' : '❌ Disabled'}`);
      break;
    }
    case 'status': {
      showStatus();
      break;
    }
    case 'reset': {
      simulator.reset();
      dataCount = 0;
      console.log('[SIMULATOR] 🔄 Reset to defaults (NORMAL scenario, stopped)');
      break;
    }
    case 'help': {
      showHelp();
      break;
    }
    case 'quit':
    case 'exit': {
      console.log('[SIMULATOR] 👋 Exiting...');
      try { simulator.stop(); } catch (e) {}
      rl.close();
      process.exit(0);
      break;
    }
    default:
      console.log(`[SIMULATOR] Unknown command: '${cmd}'`);
      showHelp();
  }

  rl.prompt();
}).on('close', () => {
  console.log('\n[SIMULATOR] 👋 Goodbye! Total data points sent: ' + dataCount);
  process.exit(0);
});

// Initial prompt
console.log("[SIMULATOR] Type 'start' to begin sending data or 'help' for commands\n");
rl.prompt();

// Graceful shutdown on SIGINT
process.on('SIGINT', () => {
  console.log('\n[SIMULATOR] ⏹️  Shutting down gracefully...');
  try { simulator.stop(); } catch (e) {}
  console.log(`[SIMULATOR] Total data points sent: ${dataCount}`);
  process.exit(0);
});

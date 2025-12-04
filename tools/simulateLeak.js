#!/usr/bin/env node

/**
 * simulateLeak.js
 * Simple non-interactive script to run a leak scenario for AI testing.
 * Usage:
 *   node tools/simulateLeak.js [minor|major|burst] [count] [intervalMs]
 * Examples:
 *   node tools/simulateLeak.js major 30 1000
 */

const { simulator, SCENARIOS } = require('../utils/dataSimulator');

const fetch = global.fetch || require('node-fetch');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const SENSOR_ENDPOINT = `${BACKEND_URL}/api/sensor-data`;

const args = process.argv.slice(2);
const scenarioArg = (args[0] || 'major').toLowerCase();
const count = parseInt(args[1], 10) || 30;
const intervalMs = parseInt(args[2], 10) || 1000;

let scenario = SCENARIOS.MAJOR_LEAK;
if (scenarioArg === 'minor') scenario = SCENARIOS.MINOR_LEAK;
if (scenarioArg === 'burst') scenario = SCENARIOS.PIPE_BURST;

console.log(`[SIMULATE-LEAK] Starting leak simulation: scenario=${scenario}, count=${count}, interval=${intervalMs}ms`);

simulator.switchScenario(scenario);

let sent = 0;

const interval = setInterval(async () => {
  const data = simulator._generateSensorData ? simulator._generateSensorData() : null;
  // simulator exposes onData callback; however we can call the internal generator
  // If generator not available, fall back to registering callback

  if (!data) {
    console.warn('[SIMULATE-LEAK] Simulator internal generator not accessible, falling back to onData posting');
    simulator.onData(async (d) => {
      try {
        await postPayload(d);
      } catch (e) {}
    });
    simulator.start(intervalMs);
    // Let simulator run for count intervals then stop
    setTimeout(() => {
      simulator.stop();
      process.exit(0);
    }, count * intervalMs + 500);
    return;
  }

  try {
    await postPayload(data);
    sent++;
    console.log(`[SIMULATE-LEAK] Sent ${sent}/${count}`);
    if (sent >= count) {
      clearInterval(interval);
      console.log('[SIMULATE-LEAK] Finished sending leak scenario samples');
      process.exit(0);
    }
  } catch (err) {
    console.error('[SIMULATE-LEAK] Error posting data:', err.message || err);
    clearInterval(interval);
    process.exit(1);
  }
}, intervalMs);

async function postPayload(payload) {
  // include valve_state if missing
  const body = { ...payload, valve_state: payload.valve_state || 'OPEN' };

  const resp = await fetch(SENSOR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`POST failed ${resp.status}: ${text}`);
  }

  return resp.json();
}

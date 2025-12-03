/**
 * Data Simulator Module
 * Generates realistic water sensor data streams with various scenarios
 * Includes: normal operation, minor leak, major leak, and pipe burst scenarios
 */

const { generateId, getCurrentTimestamp } = require('./helpers');

// Simulation constants
const SCENARIOS = {
  NORMAL: 'NORMAL',
  MINOR_LEAK: 'MINOR_LEAK',
  MAJOR_LEAK: 'MAJOR_LEAK',
  PIPE_BURST: 'PIPE_BURST'
};

const NORMAL_PRESSURE_RANGE = { min: 40, max: 60 }; // PSI
const NORMAL_FLOW_RANGE = { min: 5, max: 15 }; // L/min
const NORMAL_VARIATION = { pressure: 0.5, flow: 0.3 }; // Small variations

class DataSimulator {
  constructor() {
    this.currentScenario = SCENARIOS.NORMAL;
    this.isRunning = false;
    this.simulationInterval = null;
    this.currentPressure = 50; // PSI
    this.currentFlow = 10; // L/min
    this.simulationStep = 0;
    this.anomalies = [];
    this.dataCallback = null;
    this.generatedDataCount = 0;

    console.log('[SIMULATOR] Data Simulator initialized');
    console.log(`[SIMULATOR] Available scenarios: ${Object.values(SCENARIOS).join(', ')}`);
  }

  /**
   * Generate random value within a range with optional variation
   */
  _generateRandomValue(min, max, variation = 0) {
    const range = max - min;
    const randomValue = Math.random() * range + min;
    const variationOffset = (Math.random() - 0.5) * variation * 2;
    return Math.max(min, Math.min(max, randomValue + variationOffset));
  }

  /**
   * NORMAL SCENARIO: Stable pressure and flow
   */
  _generateNormalData() {
    this.currentPressure = this._generateRandomValue(
      NORMAL_PRESSURE_RANGE.min,
      NORMAL_PRESSURE_RANGE.max,
      NORMAL_VARIATION.pressure
    );

    this.currentFlow = this._generateRandomValue(
      NORMAL_FLOW_RANGE.min,
      NORMAL_FLOW_RANGE.max,
      NORMAL_VARIATION.flow
    );

    return {
      pressure: Math.round(this.currentPressure * 100) / 100,
      flow: Math.round(this.currentFlow * 100) / 100,
      leak_status: false,
      valve_state: 'OPEN'
    };
  }

  /**
   * MINOR LEAK SCENARIO: Gradual pressure drop over time
   * Pressure drops 2-5% every cycle, flow increases 10-20%
   */
  _generateMinorLeakData() {
    const pressureDrop = this._generateRandomValue(0.02, 0.05) * this.currentPressure;
    this.currentPressure = Math.max(10, this.currentPressure - pressureDrop);

    const flowIncrease = this._generateRandomValue(0.1, 0.2) * this.currentFlow;
    this.currentFlow = Math.min(50, this.currentFlow + flowIncrease);

    // Minor leak detected if pressure drops below 45 PSI
    const leakDetected = this.currentPressure < 45;

    return {
      pressure: Math.round(this.currentPressure * 100) / 100,
      flow: Math.round(this.currentFlow * 100) / 100,
      leak_status: leakDetected,
      valve_state: 'OPEN'
    };
  }

  /**
   * MAJOR LEAK SCENARIO: Sudden pressure drop 20-40%, flow spike 50-100%
   */
  _generateMajorLeakData() {
    // Sudden pressure drop
    if (this.simulationStep === 0) {
      const pressureDrop = this._generateRandomValue(0.2, 0.4) * this.currentPressure;
      this.currentPressure = Math.max(5, this.currentPressure - pressureDrop);
    } else {
      // Continued pressure degradation
      const pressureDrop = this._generateRandomValue(0.05, 0.1) * this.currentPressure;
      this.currentPressure = Math.max(5, this.currentPressure - pressureDrop);
    }

    // Flow spike
    const flowIncrease = this._generateRandomValue(0.5, 1.0) * this.currentFlow;
    this.currentFlow = Math.min(80, this.currentFlow + flowIncrease);

    return {
      pressure: Math.round(this.currentPressure * 100) / 100,
      flow: Math.round(this.currentFlow * 100) / 100,
      leak_status: true,
      valve_state: 'OPEN'
    };
  }

  /**
   * PIPE BURST SCENARIO: Pressure drop >50%, unstable flow
   */
  _generatePipeBurstData() {
    // Catastrophic pressure drop
    if (this.simulationStep === 0) {
      const pressureDrop = this._generateRandomValue(0.5, 0.9) * this.currentPressure;
      this.currentPressure = Math.max(0, this.currentPressure - pressureDrop);
    } else {
      // Chaotic pressure fluctuations
      const change = (Math.random() - 0.5) * 10;
      this.currentPressure = Math.max(0, Math.min(30, this.currentPressure + change));
    }

    // Highly unstable and high flow
    this.currentFlow = this._generateRandomValue(40, 100);

    return {
      pressure: Math.round(this.currentPressure * 100) / 100,
      flow: Math.round(this.currentFlow * 100) / 100,
      leak_status: true,
      valve_state: 'OPEN'
    };
  }

  /**
   * Generate sensor data based on current scenario
   */
  _generateSensorData() {
    let data;

    switch (this.currentScenario) {
      case SCENARIOS.NORMAL:
        data = this._generateNormalData();
        break;
      case SCENARIOS.MINOR_LEAK:
        data = this._generateMinorLeakData();
        break;
      case SCENARIOS.MAJOR_LEAK:
        data = this._generateMajorLeakData();
        break;
      case SCENARIOS.PIPE_BURST:
        data = this._generatePipeBurstData();
        break;
      default:
        data = this._generateNormalData();
    }

    // Apply any active anomalies
    data = this._applyAnomalies(data);

    return data;
  }

  /**
   * Apply injected anomalies to data
   */
  _applyAnomalies(data) {
    // Remove expired anomalies
    this.anomalies = this.anomalies.filter(a => {
      return a.expiresAt > getCurrentTimestamp();
    });

    // Apply remaining anomalies
    this.anomalies.forEach(anomaly => {
      if (anomaly.type === 'PRESSURE_SPIKE') {
        data.pressure = Math.min(80, data.pressure + anomaly.magnitude);
      } else if (anomaly.type === 'PRESSURE_DROP') {
        data.pressure = Math.max(0, data.pressure - anomaly.magnitude);
      } else if (anomaly.type === 'FLOW_SPIKE') {
        data.flow = Math.min(100, data.flow + anomaly.magnitude);
      } else if (anomaly.type === 'FLOW_DROP') {
        data.flow = Math.max(0, data.flow - anomaly.magnitude);
      }
    });

    return data;
  }

  /**
   * Log current simulation state
   */
  _logSimulationState(data) {
    const timestamp = new Date().toISOString();
    const step = this.simulationStep.toString().padStart(4, '0');
    const scenario = this.currentScenario.padEnd(12);
    const pressure = data.pressure.toString().padStart(6);
    const flow = data.flow.toString().padStart(6);
    const leak = data.leak_status ? '⚠️  LEAK' : '✓ OK   ';
    const anomaliesStr = this.anomalies.length > 0 ? ` | Anomalies: ${this.anomalies.length}` : '';

    console.log(
      `[${timestamp}] [STEP ${step}] [${scenario}] Pressure: ${pressure} PSI | Flow: ${flow} L/min | Status: ${leak}${anomaliesStr}`
    );
  }

  /**
   * Start simulation with specified interval
   */
  start(intervalMs = 1000) {
    if (this.isRunning) {
      console.warn('[SIMULATOR] Simulation is already running');
      return;
    }

    this.isRunning = true;
    this.simulationStep = 0;
    this.generatedDataCount = 0;

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`[SIMULATOR] Starting data simulation`);
    console.log(`[SIMULATOR] Scenario: ${this.currentScenario}`);
    console.log(`[SIMULATOR] Interval: ${intervalMs}ms`);
    console.log(`${'═'.repeat(80)}\n`);

    this.simulationInterval = setInterval(() => {
      const data = this._generateSensorData();
      this._logSimulationState(data);

      // Call callback if registered
      if (this.dataCallback) {
        this.dataCallback(data);
      }

      this.simulationStep++;
      this.generatedDataCount++;
    }, intervalMs);
  }

  /**
   * Stop simulation
   */
  stop() {
    if (!this.isRunning) {
      console.warn('[SIMULATOR] Simulation is not running');
      return;
    }

    clearInterval(this.simulationInterval);
    this.isRunning = false;

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`[SIMULATOR] Simulation stopped`);
    console.log(`[SIMULATOR] Total data points generated: ${this.generatedDataCount}`);
    console.log(`${'═'.repeat(80)}\n`);
  }

  /**
   * Switch to a different scenario
   */
  switchScenario(scenario) {
    if (!Object.values(SCENARIOS).includes(scenario)) {
      console.error(`[SIMULATOR] Invalid scenario: ${scenario}`);
      console.error(`[SIMULATOR] Available scenarios: ${Object.values(SCENARIOS).join(', ')}`);
      return false;
    }

    this.currentScenario = scenario;
    this.simulationStep = 0;

    // Reset baseline values for new scenario
    switch (scenario) {
      case SCENARIOS.NORMAL:
        this.currentPressure = 50;
        this.currentFlow = 10;
        break;
      case SCENARIOS.MINOR_LEAK:
        this.currentPressure = 55;
        this.currentFlow = 10;
        break;
      case SCENARIOS.MAJOR_LEAK:
        this.currentPressure = 50;
        this.currentFlow = 15;
        break;
      case SCENARIOS.PIPE_BURST:
        this.currentPressure = 50;
        this.currentFlow = 12;
        break;
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`[SIMULATOR] Scenario switched to: ${scenario}`);
    console.log(`[SIMULATOR] Baseline pressure reset to: ${this.currentPressure} PSI`);
    console.log(`[SIMULATOR] Baseline flow reset to: ${this.currentFlow} L/min`);
    console.log(`${'═'.repeat(80)}\n`);

    return true;
  }

  /**
   * Inject an anomaly into the data stream
   * @param {string} type - PRESSURE_SPIKE, PRESSURE_DROP, FLOW_SPIKE, FLOW_DROP
   * @param {number} magnitude - The amount to change the value
   * @param {number} durationMs - How long the anomaly lasts
   */
  injectAnomaly(type, magnitude, durationMs = 5000) {
    const validTypes = ['PRESSURE_SPIKE', 'PRESSURE_DROP', 'FLOW_SPIKE', 'FLOW_DROP'];

    if (!validTypes.includes(type)) {
      console.error(`[SIMULATOR] Invalid anomaly type: ${type}`);
      console.error(`[SIMULATOR] Valid types: ${validTypes.join(', ')}`);
      return false;
    }

    if (magnitude <= 0) {
      console.error('[SIMULATOR] Anomaly magnitude must be greater than 0');
      return false;
    }

    const anomaly = {
      id: generateId(),
      type,
      magnitude,
      expiresAt: getCurrentTimestamp() + durationMs
    };

    this.anomalies.push(anomaly);

    console.log(`\n[SIMULATOR] ⚡ Anomaly injected: ${type}`);
    console.log(`[SIMULATOR] Magnitude: ${magnitude}`);
    console.log(`[SIMULATOR] Duration: ${durationMs}ms`);
    console.log(`[SIMULATOR] Active anomalies: ${this.anomalies.length}\n`);

    return true;
  }

  /**
   * Register a callback function to receive generated data
   */
  onData(callback) {
    if (typeof callback !== 'function') {
      console.error('[SIMULATOR] Callback must be a function');
      return false;
    }

    this.dataCallback = callback;
    console.log('[SIMULATOR] Data callback registered');
    return true;
  }

  /**
   * Get current simulation state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      currentScenario: this.currentScenario,
      currentPressure: this.currentPressure,
      currentFlow: this.currentFlow,
      simulationStep: this.simulationStep,
      generatedDataCount: this.generatedDataCount,
      activeAnomalies: this.anomalies.length
    };
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    return Object.values(SCENARIOS);
  }

  /**
   * Reset simulator to initial state
   */
  reset() {
    this.stop();
    this.currentScenario = SCENARIOS.NORMAL;
    this.simulationStep = 0;
    this.generatedDataCount = 0;
    this.currentPressure = 50;
    this.currentFlow = 10;
    this.anomalies = [];
    this.dataCallback = null;

    console.log('[SIMULATOR] Simulator reset to initial state');
  }
}

// Create singleton instance
const simulator = new DataSimulator();

module.exports = {
  DataSimulator,
  simulator,
  SCENARIOS
};

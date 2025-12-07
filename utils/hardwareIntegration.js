/**
 * Hardware Integration Module
 * Initializes and manages hardware valve controller with auto-close functionality
 */

const AutoCloseValveManager = require('./autoCloseValveManager');

let autoCloseManager = null;
let hardwareValveController = null;

/**
 * Initialize hardware valve system
 * Call this from src/index.js after starting the backend
 */
async function initializeHardwareValve(dualAIEngine, config = {}) {
  try {
    // Import controller only when needed to avoid require errors
    try {
      hardwareValveController = require('./hardwareValveController');
    } catch (error) {
      console.warn('[HARDWARE-INIT] ⚠️  hardwareValveController not available:', error.message);
      return null;
    }

    // Default configuration
    const hardwareConfig = {
      protocol: config.protocol || 'serial', // 'serial', 'mqtt', or 'http'
      port: config.port || 'COM3',           // Serial port
      baudRate: config.baudRate || 115200,
      mqttBroker: config.mqttBroker || 'mqtt://localhost:1883',
      heltecUrl: config.heltecUrl || 'http://192.168.1.100/api/valve',
      gpioPin: config.gpioPin || 'GPIO21',
      ...config
    };

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  HARDWARE VALVE INITIALIZATION         ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('[HARDWARE-INIT] Configuration:');
    console.log(`  Protocol: ${hardwareConfig.protocol}`);
    console.log(`  GPIO Pin: ${hardwareConfig.gpioPin}`);
    if (hardwareConfig.protocol === 'serial') {
      console.log(`  Serial Port: ${hardwareConfig.port}`);
      console.log(`  Baud Rate: ${hardwareConfig.baudRate}`);
    } else if (hardwareConfig.protocol === 'mqtt') {
      console.log(`  MQTT Broker: ${hardwareConfig.mqttBroker}`);
    } else if (hardwareConfig.protocol === 'http') {
      console.log(`  Heltec URL: ${hardwareConfig.heltecUrl}`);
    }

    // Re-initialize hardware controller with new config
    hardwareValveController.config = hardwareConfig;

    // Create auto-close manager
    autoCloseManager = new AutoCloseValveManager(hardwareValveController, dualAIEngine);
    
    // Initialize connection
    const connected = await autoCloseManager.initialize();
    
    if (connected) {
      console.log('[HARDWARE-INIT] ✓ Hardware valve system ready');
      console.log('[HARDWARE-INIT] Auto-close enabled at 85% probability threshold');
      console.log('[HARDWARE-INIT] ✓ System Status: READY\n');
    } else {
      console.warn('[HARDWARE-INIT] ⚠️  Hardware not connected - simulation mode active');
      console.warn('[HARDWARE-INIT] ⚠️  Auto-close will be simulated only\n');
    }

    return autoCloseManager;
  } catch (error) {
    console.error('[HARDWARE-INIT] Initialization failed:', error.message);
    return null;
  }
}

/**
 * Process detection and trigger auto-close if needed
 * Call this from the detection processing pipeline
 */
async function processDetectionForAutoClose(detectionResult) {
  if (!autoCloseManager) {
    return; // Hardware not initialized
  }

  try {
    await autoCloseManager.processDetection(detectionResult);
  } catch (error) {
    console.error('[HARDWARE-PROCESS] Error processing detection:', error.message);
  }
}

/**
 * Manual valve control endpoints
 */
const valveControlEndpoints = {
  /**
   * Close valve manually
   */
  async closeValve(reason = 'Manual control') {
    if (!autoCloseManager) {
      // Return simulated response if hardware not initialized
      console.log('[VALVE-CONTROL] Simulated close:', reason);
      return {
        success: true,
        operation: 'CLOSE',
        state: 'CLOSED',
        timestamp: new Date().toISOString(),
        reason,
        simulated: true
      };
    }
    return await autoCloseManager.manualCloseValve(reason);
  },

  /**
   * Open valve manually
   */
  async openValve(reason = 'Manual control') {
    if (!autoCloseManager) {
      // Return simulated response if hardware not initialized
      console.log('[VALVE-CONTROL] Simulated open:', reason);
      return {
        success: true,
        operation: 'OPEN',
        state: 'OPEN',
        timestamp: new Date().toISOString(),
        reason,
        simulated: true
      };
    }
    return await autoCloseManager.manualOpenValve(reason);
  },

  /**
   * Get current valve state
   */
  getState() {
    if (!autoCloseManager) {
      return { 
        message: 'Hardware valve system not initialized - using simulation mode',
        simulated: true
      };
    }
    return autoCloseManager.getState();
  },

  /**
   * Enable/disable auto-close
   */
  setAutoCloseEnabled(enabled) {
    if (!autoCloseManager) {
      console.warn('[VALVE-CONTROL] Cannot set auto-close - hardware not initialized');
      return;
    }
    autoCloseManager.setAutoCloseEnabled(enabled);
  },

  /**
   * Change auto-close threshold
   */
  setAutoCloseThreshold(threshold) {
    if (!autoCloseManager) {
      console.warn('[VALVE-CONTROL] Cannot set threshold - hardware not initialized');
      return;
    }
    autoCloseManager.setAutoCloseThreshold(threshold);
  }
};

module.exports = {
  initializeHardwareValve,
  processDetectionForAutoClose,
  valveControlEndpoints,
  getAutoCloseManager: () => autoCloseManager
};

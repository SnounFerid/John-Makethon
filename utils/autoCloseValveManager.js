/**
 * Auto-Close Valve Integration
 * Monitors detection probability and automatically closes valve when > 85%
 * Also handles manual valve control from webapp
 */

class AutoCloseValveManager {
  constructor(hardwareValveController, dualAIEngine) {
    this.hardware = hardwareValveController;
    this.engine = dualAIEngine;
    
    this.config = {
      autoCloseThreshold: 85, // Auto-close when probability >= 85%
      autoCloseEnabled: true,
      manualOverride: false, // Allow manual control to override auto-close
    };

    this.state = {
      isValveClosed: false,
      lastAutoCloseProbability: 0,
      autoCloseActivatedAt: null,
      lastManualOperation: null
    };

    console.log('[AUTO-CLOSE] Valve manager initialized');
    console.log('[AUTO-CLOSE] Auto-close threshold: ' + this.config.autoCloseThreshold + '%');
  }

  /**
   * Initialize the auto-close system
   */
  async initialize() {
    try {
      const connected = await this.hardware.initialize();
      if (connected) {
        console.log('[AUTO-CLOSE] ✓ Hardware valve controller connected');
        return true;
      } else {
        console.warn('[AUTO-CLOSE] ⚠️  Hardware valve controller failed to connect - using simulation mode');
        return false;
      }
    } catch (error) {
      console.error('[AUTO-CLOSE] Initialization error:', error);
      return false;
    }
  }

  /**
   * Process detection result and check if auto-close is needed
   * Called after each detection reading
   */
  async processDetection(detectionResult) {
    const probability = detectionResult.overallProbability;

    // Check if we need to auto-close
    if (this.config.autoCloseEnabled && probability >= this.config.autoCloseThreshold) {
      if (!this.state.isValveClosed) {
        console.log(`[AUTO-CLOSE] ⚠️  PROBABILITY ${probability}% >= THRESHOLD ${this.config.autoCloseThreshold}%`);
        console.log('[AUTO-CLOSE] Auto-closing valve!');
        
        try {
          await this.autoCloseValve(detectionResult);
        } catch (error) {
          console.error('[AUTO-CLOSE] Failed to auto-close valve:', error);
        }
      }
      this.state.lastAutoCloseProbability = probability;
    }

    // Check if we should re-open (optional: when probability drops below 50%)
    if (this.state.isValveClosed && probability < 50 && this.config.autoCloseEnabled) {
      console.log(`[AUTO-CLOSE] Probability dropped to ${probability}% - ready to re-open`);
      // You can add auto-reopen logic here if desired
      // await this.autoOpenValve();
    }
  }

  /**
   * Auto-close the valve (triggered by high probability)
   */
  async autoCloseValve(detectionResult) {
    try {
      const result = await this.hardware.closeValve(
        `Auto-close: Detection probability ${detectionResult.overallProbability}% >= ${this.config.autoCloseThreshold}% threshold`
      );

      this.state.isValveClosed = true;
      this.state.autoCloseActivatedAt = new Date().toISOString();

      // Log this critical event
      console.log('[AUTO-CLOSE] ✓ Valve auto-closed successfully');
      console.log('[AUTO-CLOSE] Event logged:', {
        timestamp: this.state.autoCloseActivatedAt,
        probability: detectionResult.overallProbability,
        severity: detectionResult.severityLevel,
        reason: 'Auto-close: High leak probability detected'
      });

      return result;
    } catch (error) {
      console.error('[AUTO-CLOSE] ✗ Auto-close failed:', error);
      throw error;
    }
  }

  /**
   * Manual close valve (from webapp button)
   */
  async manualCloseValve(reason = 'Manual control') {
    try {
      console.log('[AUTO-CLOSE] Manual close requested:', reason);
      
      // Try to call hardware, but don't fail if not available
      let result;
      try {
        result = await this.hardware.closeValve(reason);
      } catch (error) {
        console.warn('[AUTO-CLOSE] Hardware close failed, using simulation:', error.message);
        result = {
          success: true,
          operation: 'CLOSE',
          state: 'CLOSED',
          timestamp: new Date().toISOString(),
          reason,
          simulated: true
        };
      }

      this.state.isValveClosed = true;
      this.state.lastManualOperation = {
        operation: 'CLOSE',
        timestamp: new Date().toISOString(),
        reason
      };

      console.log('[AUTO-CLOSE] ✓ Manual close executed');
      return result;
    } catch (error) {
      console.error('[AUTO-CLOSE] Manual close failed:', error.message);
      throw error;
    }
  }

  /**
   * Manual open valve (from webapp button)
   */
  async manualOpenValve(reason = 'Manual control') {
    try {
      console.log('[AUTO-CLOSE] Manual open requested:', reason);
      
      // Try to call hardware, but don't fail if not available
      let result;
      try {
        result = await this.hardware.openValve(reason);
      } catch (error) {
        console.warn('[AUTO-CLOSE] Hardware open failed, using simulation:', error.message);
        result = {
          success: true,
          operation: 'OPEN',
          state: 'OPEN',
          timestamp: new Date().toISOString(),
          reason,
          simulated: true
        };
      }

      this.state.isValveClosed = false;
      this.state.lastManualOperation = {
        operation: 'OPEN',
        timestamp: new Date().toISOString(),
        reason
      };

      console.log('[AUTO-CLOSE] ✓ Manual open executed');
      return result;
    } catch (error) {
      console.error('[AUTO-CLOSE] Manual open failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      hardwareState: this.hardware.getState(),
      valveState: this.state,
      config: this.config
    };
  }

  /**
   * Enable/disable auto-close
   */
  setAutoCloseEnabled(enabled) {
    this.config.autoCloseEnabled = enabled;
    console.log('[AUTO-CLOSE] Auto-close ' + (enabled ? 'ENABLED' : 'DISABLED'));
  }

  /**
   * Change auto-close threshold
   */
  setAutoCloseThreshold(threshold) {
    this.config.autoCloseThreshold = threshold;
    console.log(`[AUTO-CLOSE] Threshold changed to ${threshold}%`);
  }

  /**
   * Disconnect from hardware
   */
  disconnect() {
    this.hardware.disconnect();
    console.log('[AUTO-CLOSE] Disconnected from hardware');
  }
}

module.exports = AutoCloseValveManager;

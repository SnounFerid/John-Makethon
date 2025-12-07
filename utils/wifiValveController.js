/**
 * WiFi Valve Controller for Heltec V2
 * 
 * Communicates with the Heltec V2 (ESP32) over HTTP
 * Provides valve control methods for the leak detection system
 * 
 * Heltec Setup:
 * 1. Upload heltec_v2_firmware.ino to the board
 * 2. Update SSID and PASSWORD in the firmware
 * 3. Heltec will connect to WiFi and display its IP
 * 4. Update HELTEC_IP below to match the IP shown on the device
 */

const http = require('http');
const https = require('https');

class WiFiValveController {
  constructor(heltecIP = '192.168.1.100', port = 80) {
    this.heltecIP = heltecIP;
    this.port = port;
    this.baseURL = `http://${heltecIP}:${port}`;
    this.isConnected = false;
    this.lastStateCheckTime = 0;
    this.stateCheckInterval = 5000; // Check status every 5 seconds
    this.connectionTimeout = 10000; // 10 second timeout
    
    console.log(`[WIFI_VALVE] Initializing WiFi Valve Controller`);
    console.log(`[WIFI_VALVE] Target Heltec: ${this.baseURL}`);
  }

  /**
   * Make HTTP request
   */
  _makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname,
        method: method,
        timeout: this.connectionTimeout
      };

      const client = http;
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: json
            });
          } catch (err) {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });
  }

  /**
   * Initialize and test connection
   */
  async initialize() {
    console.log('[WIFI_VALVE] Attempting to connect to Heltec V2...');
    try {
      const response = await this._makeRequest(`${this.baseURL}/info`, 'GET');

      if (response.status === 200) {
        const data = response.data;
        this.isConnected = true;
        
        console.log('[WIFI_VALVE] ✅ Connected to Heltec V2');
        console.log(`[WIFI_VALVE] IP: ${this.heltecIP}`);
        console.log(`[WIFI_VALVE] Firmware: ${data.firmware_version}`);
        console.log(`[WIFI_VALVE] Valve Pin: GPIO${data.valve_pin}`);
        console.log(`[WIFI_VALVE] Current State: ${data.current_state}`);
        
        return true;
      }
    } catch (error) {
      console.warn('[WIFI_VALVE] ⚠️  Failed to connect to Heltec V2');
      console.warn(`[WIFI_VALVE] Error: ${error.message}`);
      console.warn(`[WIFI_VALVE] Make sure:`);
      console.warn(`[WIFI_VALVE]   1. Heltec is powered on`);
      console.warn(`[WIFI_VALVE]   2. SSID/Password are correct in firmware`);
      console.warn(`[WIFI_VALVE]   3. Heltec IP (${this.heltecIP}) is correct`);
      console.warn(`[WIFI_VALVE]   4. Both devices are on same WiFi network`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Open the valve
   */
  async openValve(reason = 'Backend request') {
    if (!this.isConnected) {
      console.warn('[WIFI_VALVE] ⚠️  Not connected to Heltec, attempting reconnect...');
      await this.initialize();
      if (!this.isConnected) {
        throw new Error('Not connected to Heltec V2');
      }
    }

    try {
      console.log('[WIFI_VALVE] 🔓 Opening valve...');
      const response = await this._makeRequest(`${this.baseURL}/open`, 'POST');

      if (response.status === 200) {
        const data = response.data;
        console.log(`[WIFI_VALVE] ✅ Valve opened`);
        console.log(`[WIFI_VALVE] Reason: ${reason}`);
        
        return {
          success: true,
          state: 'OPEN',
          message: data.message
        };
      }
    } catch (error) {
      console.error('[WIFI_VALVE] ❌ Failed to open valve:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Close the valve
   */
  async closeValve(reason = 'Backend request') {
    if (!this.isConnected) {
      console.warn('[WIFI_VALVE] ⚠️  Not connected to Heltec, attempting reconnect...');
      await this.initialize();
      if (!this.isConnected) {
        throw new Error('Not connected to Heltec V2');
      }
    }

    try {
      console.log('[WIFI_VALVE] 🔒 Closing valve...');
      const response = await this._makeRequest(`${this.baseURL}/close`, 'POST');

      if (response.status === 200) {
        const data = response.data;
        console.log(`[WIFI_VALVE] ✅ Valve closed`);
        console.log(`[WIFI_VALVE] Reason: ${reason}`);
        
        return {
          success: true,
          state: 'CLOSED',
          message: data.message
        };
      }
    } catch (error) {
      console.error('[WIFI_VALVE] ❌ Failed to close valve:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get current valve status
   */
  async getStatus() {
    if (!this.isConnected) {
      return { state: 'UNKNOWN', connected: false };
    }

    try {
      const response = await this._makeRequest(`${this.baseURL}/status`, 'GET');

      if (response.status === 200) {
        const data = response.data;
        return {
          state: data.valve_state,
          connected: true,
          uptime: data.uptime_ms
        };
      }
    } catch (error) {
      console.warn('[WIFI_VALVE] ⚠️  Failed to get status:', error.message);
      this.isConnected = false;
      return { state: 'UNKNOWN', connected: false };
    }
  }

  /**
   * Get device info
   */
  async getInfo() {
    try {
      const response = await this._makeRequest(`${this.baseURL}/info`, 'GET');
      return response.data;
    } catch (error) {
      console.error('[WIFI_VALVE] Failed to get info:', error.message);
      return null;
    }
  }

  /**
   * Check connection status
   */
  async checkConnection() {
    try {
      const status = await this.getStatus();
      if (!status.connected) {
        this.isConnected = false;
        return false;
      }
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }
}

// Singleton instance
let wifiValveController = null;

/**
 * Initialize WiFi valve controller
 */
function initializeWiFiValve(heltecIP = process.env.HELTEC_IP || '192.168.1.100') {
  wifiValveController = new WiFiValveController(heltecIP);
  return wifiValveController;
}

module.exports = {
  WiFiValveController,
  initializeWiFiValve,
  getWiFiValveController: () => wifiValveController
};

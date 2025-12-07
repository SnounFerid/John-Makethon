# Hardware Valve Integration Guide

## Overview
This system allows you to control a real-world water valve using a Heltec V2 microcontroller. The valve will:
1. **Close automatically** when leak probability exceeds 85%
2. **Respond to manual controls** from the webapp (Open/Close buttons)
3. **Report status** back to the backend

---

## Hardware Setup

### Components Needed
- **Heltec V2** (ESP32 with WiFi & OLED display)
- **Solenoid valve** (12V or 24V relay-controlled)
- **Relay module** (1 channel, matches your power supply)
- **Power supply** (12V or 24V DC, depending on solenoid)
- **USB cable** for serial communication
- **Jumper wires**

### Wiring Diagram

```
Heltec V2 PIN GPIO21  ──→  Relay IN
                            Relay COM ──→ GND
                            Relay NO  ──→ Solenoid Valve (+)
                            Solenoid Valve (-) ──→ Power Supply (-)
                            Power Supply (+) ──→ Relay VCC
```

**Pin Configuration:**
- `GPIO21` = Valve Control Output
- `HIGH` = Valve CLOSED (relay energized, solenoid pulls valve closed)
- `LOW` = Valve OPEN (relay de-energized, spring opens valve)

---

## Firmware Upload to Heltec V2

### Step 1: Install Arduino IDE & ESP32 Support
1. Download [Arduino IDE](https://www.arduino.cc/en/software)
2. Open Arduino IDE
3. Go to **File → Preferences**
4. Add this URL to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. Click OK

### Step 2: Install ESP32 Board
1. Go to **Tools → Board Manager**
2. Search for "ESP32"
3. Click "ESP32 by Espressif Systems" → Install

### Step 3: Install Required Libraries
1. Go to **Sketch → Include Library → Manage Libraries**
2. Search and install:
   - **ArduinoJson** (by Benoit Blanchon)
   - **U8g2** (OLED display library)

### Step 4: Configure Board Settings
1. **Tools → Board** → Select "Heltec WiFi LoRa 32 (V2)"
2. **Tools → Upload Speed** → Select "921600"
3. **Tools → Port** → Select your COM port (e.g., COM3)

### Step 5: Upload Firmware
1. Connect Heltec V2 via USB
2. Copy the sketch from `heltec_v2_firmware.ino`
3. Paste into Arduino IDE
4. Click **Upload** (→ button)
5. Wait for "Hard resetting via RTS pin..."

### Step 6: Verify Upload
1. Open **Tools → Serial Monitor**
2. Set Baud Rate: **115200**
3. You should see:
   ```
   === HELTEC V2 VALVE CONTROLLER ===
   Ready to receive commands
   Pin: GPIO21 | Protocol: Serial JSON
   =====================================
   ```

---

## Backend Configuration

### Option 1: Serial Connection (Recommended for Testing)

**File: `src/index.js`**

Add this after initializing the backend:

```javascript
const { initializeHardwareValve } = require('./utils/hardwareIntegration');
const { dualAIEngine } = require('./utils/dualAIIntegratedEngine');

// After backend initialization...
await initializeHardwareValve(dualAIEngine, {
  protocol: 'serial',
  port: 'COM3',        // Change to your serial port
  baudRate: 115200
});
```

**Find your serial port:**
- **Windows:** Device Manager → Ports (COM & LPT) → "USB Serial Device (COMx)"
- **Linux:** `ls /dev/tty*` → usually `/dev/ttyUSB0`
- **Mac:** `ls /dev/tty.*` → usually `/dev/tty.usbserial-*`

### Option 2: MQTT Connection (For WiFi)

Requires MQTT broker running locally or in cloud.

```javascript
await initializeHardwareValve(dualAIEngine, {
  protocol: 'mqtt',
  mqttBroker: 'mqtt://localhost:1883',
  mqttTopic: 'valve/control'
});
```

### Option 3: HTTP Connection

If you want WiFi communication without MQTT:

```javascript
await initializeHardwareValve(dualAIEngine, {
  protocol: 'http',
  heltecUrl: 'http://192.168.1.100/api/valve'  // Heltec's local IP
});
```

---

## Integration in Detection Processing

The auto-close system is automatically called during detection processing.

**How it works:**

1. Detection reads sensor data
2. ML models calculate probability
3. If probability ≥ 85% → Auto-close triggered
4. Heltec receives command → GPIO21 goes HIGH
5. Relay energizes → Solenoid closes valve
6. Heltec confirms → Backend logs event

**Detection Flow:**

```
Sensor Reading
    ↓
Preprocessing
    ↓
LSTM + Regression Analysis
    ↓
Combined Score
    ↓
├─→ Check if ≥ 85%? → YES → AUTO-CLOSE VALVE
│
└─→ Alert System
```

---

## API Endpoints for Manual Control

### Close Valve (via Webapp)
```bash
POST /api/valve-control
Content-Type: application/json

{
  "operation": "CLOSE",
  "reason": "User requested"
}
```

### Open Valve
```bash
POST /api/valve-control
Content-Type: application/json

{
  "operation": "OPEN",
  "reason": "User requested"
}
```

### Check Valve Status
```bash
GET /api/valve-control/status
```

Response:
```json
{
  "success": true,
  "data": {
    "currentState": "CLOSED",
    "lastUpdated": "2025-12-07T10:30:45.123Z",
    "recentActions": [
      {
        "operation": "CLOSE",
        "timestamp": 1733643045123,
        "reason": "Auto-close: Detection probability 87% >= 85% threshold",
        "status": "SUCCESS"
      }
    ]
  }
}
```

---

## Troubleshooting

### Heltec doesn't respond to commands

**Check:**
1. Serial port is correct (Device Manager → Ports)
2. Baud rate is 115200
3. USB cable is connected
4. Arduino sketch uploaded successfully
5. Check Serial Monitor for errors

**Test with Serial Monitor:**
```json
{"cmd":"STATUS","data":{}}
```
Should receive ACK with current valve state.

### Valve doesn't move

**Check:**
1. Relay is getting power (LED lights up)
2. Solenoid has power supply connected
3. GPIO21 is properly connected to relay input
4. Relay configuration (NO vs NC contacts)

**Test GPIO manually:**
Open Serial Monitor and send:
```json
{"cmd":"CLOSE","data":{"pin":"GPIO21","signal":"HIGH"}}
```

### Auto-close not triggering

**Check:**
1. Probability is actually ≥ 85% (check logs)
2. Hardware initialized correctly (see startup logs)
3. Serial connection is working
4. Check backend logs for errors:
   ```bash
   grep -i "AUTO-CLOSE" backend.log
   ```

---

## Configuration Options

### Auto-Close Threshold
Default: **85%**

To change:
```javascript
// In hardwareIntegration.js
autoCloseManager.setAutoCloseThreshold(80); // 80%
```

### Enable/Disable Auto-Close
```javascript
autoCloseManager.setAutoCloseEnabled(true);   // Enable
autoCloseManager.setAutoCloseEnabled(false);  // Disable (manual only)
```

### Change Protocol at Runtime
Stop backend, modify config in `initializeHardwareValve()`, restart.

---

## Safety Features

1. **Timeout Protection**: If command doesn't complete in 5 seconds, error is logged
2. **State Tracking**: Backend maintains valve state even if hardware disconnects
3. **Manual Override**: Users can manually open valve even if auto-close is active
4. **Status Logging**: All operations logged with timestamps and reasons
5. **Fail-Safe**: Valve defaults to CLOSED (safer state)

---

## Monitoring & Logging

All valve operations are logged:

```
[AUTO-CLOSE] Valve auto-closed successfully
[AUTO-CLOSE] Event logged: {
  timestamp: "2025-12-07T10:30:45Z",
  probability: 87,
  severity: "CRITICAL",
  reason: "Auto-close: High leak probability detected"
}
```

View logs:
```bash
# Backend console shows real-time logs
node src/index.js | grep -i valve

# Or check database
SELECT * FROM valve_control_logs ORDER BY timestamp DESC;
```

---

## Next Steps

1. ✅ Wire your Heltec V2 to relay/solenoid
2. ✅ Upload firmware to Heltec
3. ✅ Configure backend with serial port
4. ✅ Restart backend with hardware initialization
5. ✅ Test manual valve control from webapp
6. ✅ Simulate high probability leak to test auto-close
7. ✅ Monitor real operations in logs

---

**System Ready! Your real-world valve is now integrated with AI leak detection! 🚀**

# Heltec V2 WiFi Valve Controller - Complete Setup Guide

## Overview

This system uses a **WiFi-based communication** between your backend server and the Heltec V2 (ESP32) microcontroller to control the solenoid valve. When the leak detection probability reaches **85%**, the system automatically closes the valve over WiFi.

## Hardware Requirements

- **Heltec V2** (ESP32 with built-in WiFi) - ~$20-30
- **Solenoid Valve** (12V or 24V DC) - ~$10-15
- **Relay Module** (4-channel recommended) - ~$5-10
- **Power Supply** (appropriate voltage for solenoid)
- **Jumper Wires** and **Breadboard**
- **USB Cable** for programming Heltec

## Step 1: Hardware Assembly

### Wiring Diagram

```
Heltec V2 (ESP32)
├── GPIO21 → Relay Module (Input 1)
│   └── Relay outputs to Solenoid Valve
├── GND → Relay GND
├── 5V → Relay VCC
└── USB → Power & Programming

Solenoid Valve
├── 12V/24V Power → Relay COM
├── GND → Relay GND
└── Output → Water line control
```

### Detailed Connections

1. **GPIO21 (Output)**: Control signal to relay
   - Heltec GPIO21 → Relay IN1
   
2. **Power Distribution**:
   - Heltec 5V → Relay VCC
   - Heltec GND → Relay GND
   - Solenoid 12V/24V → Relay COM (common)
   
3. **Solenoid Connection**:
   - Relay NO (Normally Open) → Solenoid (+)
   - Relay COM → Solenoid (-)
   
4. **Logic**:
   - GPIO21 = HIGH → Relay energizes → Valve OPEN
   - GPIO21 = LOW → Relay de-energizes → Valve CLOSED

## Step 2: Upload Firmware to Heltec V2

### 2.1 Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install on your computer

### 2.2 Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Boards Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click OK
5. Go to **Tools → Board → Boards Manager**
6. Search for "esp32"
7. Install **"esp32 by Espressif Systems"** (version 2.0.0 or higher)

### 2.3 Install Required Libraries
1. Go to **Sketch → Include Library → Manage Libraries**
2. Search and install:
   - **ArduinoJson** by Benoit Blanchon
   - (WiFi and WebServer are built-in)

### 2.4 Select Board Settings
1. **Tools → Board → ESP32 Arduino → "Heltec WiFi LoRa 32(V2)"**
2. **Tools → Upload Speed → 921600**
3. **Tools → Port → [Your COM Port]** (e.g., COM3, COM5)

### 2.5 Configure WiFi Credentials
Edit `heltec_v2_firmware.ino` and update:
```cpp
const char* SSID = "YOUR_WIFI_SSID";           // Your home/office WiFi name
const char* PASSWORD = "YOUR_WIFI_PASSWORD";   // Your WiFi password
```

### 2.6 Upload
1. Connect Heltec V2 via USB
2. In Arduino IDE, click **Upload** (→ button)
3. Wait for "Uploading..." → "Hard resetting via RTS pin..."
4. Open **Tools → Serial Monitor**
5. Set Baud Rate to **115200**
6. You should see:
   ```
   ╔════════════════════════════════════════╗
   ║  Heltec V2 WiFi Valve Controller       ║
   ║  GPIO21 Solenoid Valve Control         ║
   ╚════════════════════════════════════════╝
   
   🔌 Connecting to WiFi: YOUR_WIFI_SSID
   ✅ WiFi connected!
   📍 IP Address: 192.168.1.xxx
   📡 API Endpoints:
      GET  http://192.168.1.xxx/status
      POST http://192.168.1.xxx/open
      POST http://192.168.1.xxx/close
      GET  http://192.168.1.xxx/info
   ```

**Note the IP Address** (e.g., `192.168.1.100`) - you'll need this in Step 3.

## Step 3: Configure Backend

### 3.1 Set Heltec IP Address
Set the environment variable before starting the backend:

**Windows PowerShell:**
```powershell
$env:HELTEC_IP = "192.168.1.100"  # Replace with your Heltec's IP
node src/index.js
```

**Linux/Mac:**
```bash
export HELTEC_IP=192.168.1.100    # Replace with your Heltec's IP
node src/index.js
```

**Or create `.env` file:**
```
HELTEC_IP=192.168.1.100
```

### 3.2 Start Backend
```bash
cd d:\John-Makethon
node src/index.js
```

You should see:
```
[STARTUP] Initializing WiFi Valve Controller...
[STARTUP] • Target Heltec V2: 192.168.1.100
[STARTUP] ✅ WiFi Valve Controller Ready
[STARTUP] • Auto-close at 85% probability: ENABLED
[STARTUP] • Communication: HTTP REST API
[STARTUP] • GPIO Pin: 21 (Solenoid valve)
```

## Step 4: Start Simulator

Open a new terminal:
```bash
cd d:\John-Makethon
node tools/simulatePipes.js
```

## Step 5: Test the System

### Test 1: Manual Valve Control

Open a new terminal and test the Heltec endpoints:

**Get Status:**
```bash
curl http://192.168.1.100/status
```
Response:
```json
{"valve_state":"CLOSED","uptime_ms":12345,"changes":0}
```

**Open Valve:**
```bash
curl -X POST http://192.168.1.100/open
```

**Close Valve:**
```bash
curl -X POST http://192.168.1.100/close
```

**Get Info:**
```bash
curl http://192.168.1.100/info
```

### Test 2: Auto-Close at 85%

Send data that triggers 85%+ probability:

```bash
curl -X POST http://localhost:3000/api/detection/process \
  -H "Content-Type: application/json" \
  -d '{
    "pressure": 15,
    "flow": 50,
    "temperature": 25,
    "conductivity": 500,
    "valve_state": "OPEN"
  }'
```

Expected output in backend:
```
[DUAL_AI_ENGINE] 🔴 AUTO-CLOSE TRIGGERED: Auto-close triggered at 85%+ leak probability
[WIFI_VALVE] 🌐 Using WiFi valve control
[WIFI_VALVE] 🔒 Closing valve...
[WIFI_VALVE] ✅ Valve closed
```

And in Heltec V2 Serial Monitor:
```
📨 POST /close -> Backend API request
🔒 VALVE CLOSED
   Reason: Backend API request
   Uptime: 150s
```

## Step 6: Monitor via Frontend

1. Start frontend (if not already running):
   ```bash
   cd frontend
   npm start
   ```

2. Open browser: `http://localhost:3000`

3. In the **Valve Control** section:
   - Click **"OPEN"** button - valve should open
   - Click **"CLOSE"** button - valve should close
   - Watch the LED on the relay module (indicates valve state)

4. In the **Alert Panel**:
   - When probability hits 85%, you should see:
     - 🔴 CRITICAL alert
     - Valve auto-close confirmation
     - Heltec status update

## Troubleshooting

### WiFi Connection Issues

**Problem**: "Failed to connect to Heltec V2"

**Solution:**
1. Verify WiFi credentials in firmware
2. Check Heltec is on same network as your PC/server
3. Ensure Heltec IP is correct (check serial monitor)
4. Try accessing `http://192.168.1.100/info` from browser to test connectivity

### Valve Not Responding

**Problem**: Valve doesn't open/close

**Solution:**
1. Check GPIO21 pin connection to relay
2. Verify relay is powered (5V LED should be on)
3. Test relay manually with jumper wire
4. Check solenoid valve for mechanical issues
5. Verify power supply voltage for solenoid

### Backend Can't Find Heltec

**Problem**: `Failed to connect to Heltec V2` during startup

**Solution:**
1. Verify `HELTEC_IP` environment variable is set
2. Test connectivity:
   ```bash
   ping 192.168.1.100  # Use your actual IP
   ```
3. Check firewall isn't blocking port 80
4. Restart Heltec (unplug USB, wait 2 seconds, plug back in)

### Serial Monitor Shows Garbage

**Problem**: Serial monitor shows random characters

**Solution:**
1. Verify baud rate is set to **115200**
2. Check USB cable is properly connected
3. Try a different USB port
4. Install CH340 drivers (common for Heltec):
   - Windows: https://github.com/wch-ch/ch340/releases

## API Reference

### Heltec V2 Endpoints

#### GET `/status`
Get current valve status
```bash
curl http://192.168.1.100/status
```
Response:
```json
{
  "valve_state": "OPEN",
  "uptime_ms": 45123,
  "changes": 5
}
```

#### POST `/open`
Open the valve
```bash
curl -X POST http://192.168.1.100/open
```
Response:
```json
{
  "status": "OPEN",
  "message": "Valve opened"
}
```

#### POST `/close`
Close the valve
```bash
curl -X POST http://192.168.1.100/close
```
Response:
```json
{
  "status": "CLOSED",
  "message": "Valve closed"
}
```

#### GET `/info`
Get device information
```bash
curl http://192.168.1.100/info
```
Response:
```json
{
  "device": "Heltec V2 (ESP32)",
  "firmware_version": "1.0.0",
  "valve_pin": 21,
  "current_state": "OPEN",
  "uptime_seconds": 150,
  "wifi_connected": true,
  "wifi_ssid": "YOUR_WIFI_SSID",
  "ip_address": "192.168.1.100",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "rssi_dbm": -45,
  "state_changes": 5
}
```

## Detection Logic

The system automatically closes the valve when:

1. **Probability reaches 85%** (CRITICAL threshold)
2. **Valve is currently OPEN**
3. **Heltec is connected** (falls back to local control if not)

The logic:
```
IF probability >= 85% AND valve_state == "OPEN"
  THEN
    1. Log auto-close trigger
    2. Send close command to Heltec V2 via WiFi
    3. Wait for acknowledgment
    4. Log success/failure
    5. Update alert with status
END IF
```

## Performance Metrics

- **WiFi latency**: ~50-200ms per command
- **Relay response time**: ~100ms
- **Solenoid actuation time**: ~50-200ms (varies by model)
- **Total auto-close time**: 200-500ms

## Safety Notes

⚠️ **Important Safety Considerations:**

1. **Test with water OFF first** - disconnect water supply during testing
2. **Manual valve** - Always have a manual bypass valve available
3. **Power loss** - Relay should fail to a safe state (consult relay specs)
4. **WiFi reliability** - Consider adding a backup pressure relief valve
5. **Solenoid specs** - Match voltage to your power supply (typically 12V or 24V)

## Next Steps

1. ✅ Hardware assembly complete
2. ✅ Firmware uploaded to Heltec
3. ✅ Backend configured
4. ✅ Testing complete

You can now:
- Monitor live leak detection
- Auto-close valve on critical leaks
- View alerts and history
- Adjust detection thresholds

Happy leak detection! 🚀

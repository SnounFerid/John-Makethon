# Frontend WiFi Integration - Implementation Summary

## Overview
Frontend now communicates directly with Heltec V2 ESP32 via WiFi REST API with automatic fallback to backend control.

## Changes Made

### 1. **Frontend API Client (`frontend/src/services/apiClient.js`)**
Added new `heltecValveController` module with direct HTTP calls to Heltec:
- `openValve()` - POST to `http://192.168.1.152/open`
- `closeValve()` - POST to `http://192.168.1.152/close`
- `getStatus()` - GET from `http://192.168.1.152/status`
- `getInfo()` - GET from `http://192.168.1.152/info`
- `checkConnection()` - Verify Heltec availability

Configuration:
- Reads IP from `REACT_APP_HELTEC_IP` environment variable (defaults to 192.168.1.152)
- Reads port from `REACT_APP_HELTEC_PORT` environment variable (defaults to 80)
- 5-second timeout on requests
- Proper JSON Content-Type headers

### 2. **Detection Context (`frontend/src/context/DetectionContext.js`)**
Updated to use Heltec WiFi with backend fallback:
- **`controlValve(action)`** - Now tries Heltec first, falls back to backend if WiFi unavailable
  - Supports OPEN and CLOSE commands
  - Updates UI immediately for responsiveness
  - Refreshes status in background
- **`getHeltecValveStatus()`** - Directly fetch status from Heltec
- **`checkHeltecConnection()`** - Verify WiFi connectivity

### 3. **Environment Configuration (`frontend/.env.local`)**
Added WiFi configuration:
```
REACT_APP_HELTEC_IP=192.168.1.152
REACT_APP_HELTEC_PORT=80
REACT_APP_API_URL=http://localhost:3000
```

## Communication Flow

### Normal Operation (WiFi Available)
```
User clicks button in ValveControl.js
    ↓
controlValve('OPEN' or 'CLOSE') in DetectionContext
    ↓
heltecValveController.openValve() or closeValve()
    ↓
HTTP POST to http://192.168.1.152:80/open or /close
    ↓
Heltec receives command via WiFi
    ↓
GPIO21 HIGH (OPEN) or LOW (CLOSE)
    ↓
Solenoid valve + relay module responds
    ↓
Response: {"valve_state":"OPEN/CLOSED","uptime_ms":X,"changes":Y}
    ↓
UI updates immediately with optimistic update
    ↓
Status refreshed from backend in background (500ms delay)
```

### Fallback (WiFi Unavailable)
```
heltecValveController.openValve() fails
    ↓
Automatic fallback to leakDetectionAPI.controlValve()
    ↓
Backend receives control request
    ↓
Backend calls wifiValveController (tries Heltec again)
    ↓
Falls back to local valve control if still unavailable
    ↓
Response returned to frontend
```

## Auto-Close Integration

When leak probability reaches 85%+ while valve is OPEN:

1. **Backend Detection**: dualAIIntegratedEngine detects ≥85% probability
2. **Auto-trigger**: Calls `_triggerAutoClose()` method
3. **WiFi First**: integratedController tries wifiValveController (Heltec WiFi)
4. **Local Fallback**: If WiFi unavailable, uses local valve control
5. **Logging**: Records method used (WiFi or Local) in audit logs

## Testing Checklist

- [ ] Start backend: `npm run dev` in root directory
- [ ] Start frontend: `npm start` in frontend directory
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Navigate to Valve Control page
- [ ] Verify console shows `[HELTEC WIFI]` log messages
- [ ] Click OPEN button → should see `Sending OPEN command to Heltec`
- [ ] Verify Heltec responds: look for status response in logs
- [ ] Verify valve physically opens (solenoid clicks)
- [ ] Click CLOSE button → similar flow
- [ ] Check valve status updates in UI
- [ ] Check Real-time Sensor Input section shows latest readings
- [ ] Trigger leak alert (>85% probability) → valve auto-closes
- [ ] Check backend logs for `[WIFI VALVE]` or `[LOCAL VALVE]` messages

## Key Technical Details

### Heltec Endpoints (After Firmware Fix)
All endpoints now return proper JSON with Content-Type header:
```
GET /status
  Response: {"valve_state":"OPEN","uptime_ms":12345,"changes":5}

POST /open
  Response: {"valve_state":"OPEN","uptime_ms":12345,"changes":6}

POST /close
  Response: {"valve_state":"CLOSED","uptime_ms":12346,"changes":7}

GET /info
  Response: {"device":"Heltec V2","version":"1.0.0","ip":"192.168.1.152",...}
```

### Frontend Request Format
```javascript
// Direct WiFi call
const response = await fetch('http://192.168.1.152/open', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000
});
```

### Response Handling
```javascript
// Extract valve state from Heltec response
const data = await response.json();
const newState = data.valve_state; // "OPEN" or "CLOSED"

// Update UI immediately
setValveStatus(prev => ({
  ...prev,
  currentState: newState,
  lastUpdated: Date.now()
}));
```

## Troubleshooting

### "Cannot reach Heltec at 192.168.1.152"
1. Verify Heltec is powered and connected to WiFi network
2. Check IP address matches WiFi configuration
3. Ping Heltec from command line: `ping 192.168.1.152`
4. Check firewall allows port 80 traffic
5. Frontend automatically falls back to backend control

### "Valve doesn't respond after firmware fix"
1. Reupload heltec_v2_firmware.ino to device
2. Verify USB connection and Arduino IDE board settings
3. Check serial monitor for compilation/upload errors
4. Monitor serial output during valve operations

### "Frontend shows 'N/A' for valve status"
1. Check browser DevTools → Network tab for API calls
2. Verify backend is running on port 3000
3. Check `fetchValveStatus()` is being called (every 5 seconds)
4. Look for error messages in console

## Files Modified
- `frontend/src/services/apiClient.js` - Added heltecValveController
- `frontend/src/context/DetectionContext.js` - Updated controlValve, added Heltec methods
- `frontend/.env.local` - New WiFi configuration file

## Next Steps
1. Test WiFi communication with actual Heltec device
2. Verify auto-close triggers at 85% probability
3. Monitor logs for WiFi fallback scenarios
4. Adjust timeout values if network is slow
5. Consider adding visual indicator for WiFi vs Backend control

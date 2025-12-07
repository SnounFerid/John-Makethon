# WiFi Valve Control - Quick Test Guide

## Pre-Flight Checklist

### Hardware Setup
- [ ] Heltec V2 ESP32 powered on and connected to "El FabSpace Lac" WiFi
- [ ] Solenoid valve + relay module connected to GPIO21
- [ ] USB cable connected for serial monitoring (if needed)
- [ ] Verify Heltec IP: Open terminal → `ping 192.168.1.152` (should respond)

### Firmware Status
- [ ] Heltec has latest firmware uploaded with proper JSON response headers
- [ ] Serial monitor shows WiFi connected message
- [ ] Check firmware file: `/heltec_v2_firmware.ino` has `server.sendHeader("Content-Type", "application/json")`

### Backend Setup
- [ ] Backend running on port 3000: `npm run dev` in root directory
- [ ] Database initialized
- [ ] Check backend logs for "WiFi Valve Controller initialized"

### Frontend Setup
- [ ] Frontend running on port 3000 or 3001: `npm start` in frontend directory
- [ ] Browser opened to http://localhost:3000 (or 3001)
- [ ] DevTools Console visible (F12)
- [ ] Check `.env.local` has correct Heltec IP: `REACT_APP_HELTEC_IP=192.168.1.152`

## Test Sequence

### Test 1: Direct WiFi Communication (Frontend Console)
```javascript
// In browser console:
// 1. Check if fetch works to Heltec
fetch('http://192.168.1.152/status', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log('Status:', d))
.catch(e => console.error('Error:', e))

// Expected output in console:
// Status: {valve_state: "CLOSED", uptime_ms: 12345, changes: 2}

// 2. Try opening valve
fetch('http://192.168.1.152/open', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log('Open response:', d))
.catch(e => console.error('Error:', e))

// Expected: Solenoid clicks, console shows:
// Open response: {valve_state: "OPEN", uptime_ms: 12346, changes: 3}
```

### Test 2: Click OPEN Button
1. Navigate to **Valve Control** page
2. Click **OPEN** button
3. Watch console for logs:
   - `[HELTEC WIFI] Sending OPEN command to Heltec`
   - `[HELTEC WIFI] Valve opened successfully: {valve_state: "OPEN", ...}`
4. Verify valve opens (solenoid clicks)
5. Verify UI updates: Valve status shows GREEN "OPEN"

### Test 3: Click CLOSE Button
1. Click **CLOSE** button
2. Watch console for logs:
   - `[HELTEC WIFI] Sending CLOSE command to Heltec`
   - `[HELTEC WIFI] Valve closed successfully: {valve_state: "CLOSED", ...}`
3. Verify valve closes (solenoid clicks)
4. Verify UI updates: Valve status shows RED "CLOSED"

### Test 4: Status Auto-Refresh
1. Keep Valve Control page open
2. Watch console every 5 seconds for:
   - `[CONTEXT] Fetching valve status`
   - `[HELTEC WIFI] Fetching valve status from Heltec`
3. Manually open/close valve via Heltec (if possible)
4. Verify UI updates automatically within 5 seconds

### Test 5: Auto-Close at 85% Probability
1. Open **Detection Dashboard** page
2. Check current leak probability
3. Generate synthetic sensor data to increase probability
4. When probability reaches **≥85%** with valve OPEN:
   - Watch for auto-close trigger
   - Check logs: `[CONTEXT] Controlling valve CLOSE`
   - Verify valve closes automatically
   - Check backend logs for `[WIFI VALVE]` (WiFi) or `[LOCAL VALVE]` (fallback)

### Test 6: WiFi Fallback
1. Power off Heltec device
2. Click OPEN button in Valve Control
3. Watch console for logs:
   - `[HELTEC WIFI] Sending OPEN command to Heltec`
   - `[HELTEC WIFI] Failed to open valve: [timeout or connection error]`
   - `[CONTEXT] WiFi valve control failed, falling back to backend: [error message]`
   - `[LEAK DETECTION API] Controlling valve OPEN`
4. Verify UI still updates (uses backend fallback)
5. Check backend logs for fallback handling
6. Power Heltec back on for next tests

### Test 7: Real Sensor Data Flow
1. Start sensor simulator: `node simulatePipes.js`
2. Watch simulator logs check for:
   - Valve state being checked before posting
   - Data only posted when valve is OPEN
   - No data posted when valve is CLOSED
3. Check Detection Dashboard for incoming readings
4. Verify trends update as data arrives

## Expected Console Output Pattern

### Successful WiFi Control
```
[HELTEC WIFI] Sending OPEN command to Heltec
[HELTEC WIFI] Valve opened successfully: {valve_state: "OPEN", uptime_ms: 12346, changes: 3}
[CONTEXT] Valve action via WiFi successful {...}
```

### Fallback to Backend
```
[HELTEC WIFI] Sending OPEN command to Heltec
[HELTEC WIFI] Failed to open valve: AbortError: The operation was aborted.
[CONTEXT] WiFi valve control failed, falling back to backend: The operation was aborted.
[LEAK DETECTION API] Controlling valve OPEN
```

### Auto-Close Triggered
```
[AUTO-CLOSE] Probability 85% exceeds threshold - triggering auto-close
[CONTEXT] Controlling valve via Heltec WiFi {action: "CLOSE"}
[HELTEC WIFI] Sending CLOSE command to Heltec
[HELTEC WIFI] Valve closed successfully: {valve_state: "CLOSED", ...}
```

## Troubleshooting Quick Fixes

### "Cannot reach Heltec"
1. Verify IP in `.env.local`: `REACT_APP_HELTEC_IP=192.168.1.152`
2. Restart frontend dev server: `npm start`
3. Hard refresh browser: Ctrl+Shift+R (Chrome) or Cmd+Shift+R (Mac)
4. Check Heltec powered and WiFi connected

### "Valve doesn't respond"
1. Check firmware has proper headers: 
   ```cpp
   server.sendHeader("Content-Type", "application/json");
   ```
2. Reupload firmware to Heltec
3. Check solenoid wiring to GPIO21
4. Test with manual serial commands

### "UI doesn't update after click"
1. Check browser DevTools for network errors (Network tab)
2. Verify backend is running and responding
3. Check `/api/valve-control/status` endpoint works
4. Review frontend logs for error messages

### "Auto-close not triggering"
1. Verify dual AI engine running (check backend logs)
2. Ensure probability actually reaches 85%+ (check Detection Dashboard)
3. Verify valve is OPEN when probability exceeds 85%
4. Check dualAIIntegratedEngine.js has `_triggerAutoClose()` method

## Key Endpoints Reference

### Heltec Direct (WiFi)
- Status: `GET http://192.168.1.152/status` → `{valve_state, uptime_ms, changes}`
- Open: `POST http://192.168.1.152/open` → `{valve_state: "OPEN"}`
- Close: `POST http://192.168.1.152/close` → `{valve_state: "CLOSED"}`
- Info: `GET http://192.168.1.152/info` → Device info

### Backend Fallback
- Control: `POST http://localhost:3000/api/valve-control` → `{success, data}`
- Status: `GET http://localhost:3000/api/valve-control/status` → `{success, data}`
- History: `GET http://localhost:3000/api/valve-control/history` → `{success, data}`

## Performance Metrics to Monitor

- WiFi response time: Should be <500ms (5000ms timeout)
- UI update latency: Should be <200ms (optimistic update + refresh)
- Backend fallback delay: Should be <1 second total
- Auto-close execution: Should complete within 1-2 seconds

## Verification Checklist - All Systems Go ✓

- [ ] Heltec responds to direct WiFi calls from browser console
- [ ] OPEN button works and valve audibly clicks
- [ ] CLOSE button works and valve audibly clicks  
- [ ] Auto-refresh updates status every 5 seconds
- [ ] Auto-close triggers at 85% probability
- [ ] Fallback to backend works when Heltec unavailable
- [ ] Simulator respects valve state (only posts when OPEN)
- [ ] Real sensor data flows through detection system
- [ ] Detection Dashboard shows leak probability increasing
- [ ] Frontend shows all status updates in UI

All systems ready for production testing!

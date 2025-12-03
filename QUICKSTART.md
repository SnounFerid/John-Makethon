# Quick Start Guide - Real-time WebSocket System

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

**Backend:**
```bash
cd John-Makethon
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment

```bash
# Frontend - Create .env file
cd frontend
cp .env.example .env

# Edit .env if backend is on different address
# Default: REACT_APP_WEBSOCKET_URL=http://localhost:3000
```

### Step 3: Start the System

**Terminal 1 - Backend Server:**
```bash
# From project root
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║   Water Leak Detection System API Server                   ║
║   Port: 3000                                               ║
║   WebSocket: Enabled (Real-time data streaming)            ║
║   WebSocket Endpoint: ws://localhost:3000                  ║
╚════════════════════════════════════════════════════════════╝
```

**Terminal 2 - Frontend Development Server:**
```bash
# From frontend directory
npm start
```

The app will open at `http://localhost:3000` (frontend)

### Step 4: Verify Connection

1. **Check Connection Status Bar**
   - Look for status indicator in the header
   - Should show "Connected" in green
   - If connecting, will show spinner

2. **Expand Details**
   - Click the status bar to see:
     - Latency (ping/pong)
     - Messages received
     - Data freshness
     - Client ID

3. **View Real-time Data**
   - Dashboard: Gauges update every 2 seconds
   - Check freshness timestamp: "Updated X seconds ago"
   - All components show live data

## 📊 What to See

### Dashboard Component
- ✅ Pressure/Flow/Temperature gauges update in real-time
- ✅ Data freshness shows "Updated 0-2s ago"
- ✅ No manual refresh needed

### Historical Data
- ✅ "Current Real-time Reading" section at top
- ✅ Shows latest pressure, flow, temperature, conductivity
- ✅ Freshness badge shows "X ms ago"

### Leak Alert Panel
- ✅ "Latest Real-time Alert" section
- ✅ Shows most recent alert from WebSocket
- ✅ Active alerts section updates automatically

### Valve Control
- ✅ "Real-time Sensor Input" section
- ✅ Shows current pressure/flow with alert thresholds
- ✅ Helps inform valve control decisions

### AI Insights
- ✅ "Real-time Anomaly Monitoring" section
- ✅ System status (Normal/Anomaly)
- ✅ Sensor variance score updates live

### Predictive Maintenance
- ✅ "Real-time Risk Assessment" section
- ✅ Live risk factor charts (pressure, flow, temperature)
- ✅ Overall risk score updates continuously

## 🔍 Monitoring & Debugging

### Browser Console
Open Developer Tools (F12) and watch console for:
```
[WEBSOCKET CONTEXT] Connecting to ws://localhost:3000...
[WEBSOCKET CONTEXT] Connected with ID: socket_abc123
[WEBSOCKET CONTEXT] Received sensor:update event
[WEBSOCKET CONTEXT] Latency: 12ms
[DASHBOARD] Using WebSocket data: {pressure: 45.2, ...}
```

### Connection Status Details
Click the status indicator to see:
- **Client ID**: Unique socket identifier
- **Latency**: Round-trip time (should be 5-50ms)
- **Last Update**: When data was last received
- **Data Freshness**: Time since last update
- **Messages**: Count of received/sent messages
- **Reconnect Attempts**: Number of reconnections

### Manual Reconnection
If connection drops:
1. Click the status indicator
2. Click "Reconnect" or "Retry" button
3. Should reconnect within 1-2 seconds

## 🧪 Testing Real-time Updates

### Simulate Data Changes
1. Open browser DevTools console
2. Watch the Dashboard gauges
3. They should update every 2 seconds smoothly

### Test Reconnection
1. Open DevTools → Network tab
2. Disconnect network (offline mode)
3. Dashboard shows "Disconnected" status
4. Reconnect network
5. Auto-reconnects within 10 seconds max

### Test Alerts
Trigger an alert from backend:
```bash
curl -X POST http://localhost:3000/api/websocket/broadcast-alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert": {
      "severity": "HIGH",
      "message": "Test Alert",
      "leakProbability": 85,
      "location": "Test Location"
    }
  }'
```

All connected clients will see the alert in real-time!

## 🛠️ Troubleshooting

### "WebSocket not connecting"
```
Error: Failed to connect to ws://localhost:3000
```
- ✅ Check backend is running: `npm start` in project root
- ✅ Check port 3000 is not in use
- ✅ Check `REACT_APP_WEBSOCKET_URL` in .env

### "High latency" (100+ ms)
- ✅ Check network connection
- ✅ Check CPU usage on server
- ✅ Try refreshing page
- ✅ Check browser console for errors

### "Data not updating"
- ✅ Check status shows "Connected"
- ✅ Check console for error messages
- ✅ Check timestamp - should be recent
- ✅ Click reconnect button and wait

### "Connection keeps dropping"
- ✅ Check server logs for errors
- ✅ Check network stability
- ✅ Look for 10 reconnect attempts then fails
- ✅ Restart backend server

## 📈 Expected Performance

| Metric | Expected | Good | Concerning |
|--------|----------|------|------------|
| Latency | 5-50ms | <100ms | >500ms |
| Update Interval | 2s | ~2s | >3s |
| Reconnect Time | 1-2s | <5s | >10s |
| Messages/min | ~30 | ~30 | <15 |

## 🎯 Key Features Demonstrated

### Real-time Data Streaming
- Backend broadcasts 2 sensor readings per second
- Frontend receives and displays instantly
- All components share the same data via Context

### Automatic Reconnection
- Exponential backoff: 1s, 2s, 4s, 8s, etc.
- Max 10 reconnection attempts
- User sees "Reconnecting..." status

### Latency Monitoring
- Ping/pong every 5 seconds
- Shows exact round-trip time
- Helps diagnose network issues

### Data Freshness
- Shows milliseconds since last update
- "X seconds ago" display format
- Helps verify data is truly live

### Graceful Degradation
- Falls back to REST API if disconnected
- Dashboard continues working offline
- Seamless reconnection when network returns

## 📚 Next Steps

1. **Customize Broadcast Frequency**
   - Edit `BROADCAST_INTERVAL` in `src/services/websocketService.js`
   - Default: 2000ms

2. **Add More Channels**
   - Subscribe to specific data channels
   - See `WEBSOCKET_INTEGRATION.md` for details

3. **Production Deployment**
   - Change WebSocket URL to WSS (secure)
   - Add authentication
   - Configure for load balancing

4. **Custom Components**
   - Use `useContext(WebSocketContext)` in your components
   - See examples in existing components

## 📖 Full Documentation

For detailed information, see:
- `WEBSOCKET_INTEGRATION.md` - Complete technical guide
- Component source files for implementation examples
- Browser console logs with `[WEBSOCKET]` prefix

## ✅ Checklist

- [ ] Backend running (`npm start`)
- [ ] Frontend running (`npm start` in frontend dir)
- [ ] Status indicator shows "Connected"
- [ ] Dashboard gauges updating every 2 seconds
- [ ] Browser console shows WebSocket logs
- [ ] All 6 components showing real-time data
- [ ] Latency showing reasonable value (5-100ms)
- [ ] Data freshness shows "0-2 seconds ago"

---

**Everything working?** 🎉

Your water leak detection system is now running with real-time data streaming! All components are receiving live sensor data every 2 seconds with automatic reconnection, latency monitoring, and comprehensive logging.

For troubleshooting: Check browser console → Look for `[WEBSOCKET]` logs → Verify connection status indicator

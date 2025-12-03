# WebSocket Real-time Integration Guide

## Overview

The Water Leak Detection System now includes real-time data streaming via WebSocket (Socket.io) connections. This enables all dashboard components to receive live sensor updates every 2 seconds without polling.

## Architecture

### Backend (Node.js + Express + Socket.io)

#### WebSocket Service (`src/services/websocketService.js`)
- **2-Second Data Broadcast**: Continuously broadcasts sensor readings to all connected clients
- **Client Tracking**: Maintains metadata for each connected client
- **Latency Monitoring**: Implements ping/pong mechanism for latency measurement
- **Channel Subscriptions**: Supports room-based subscriptions for filtered data

**Key Classes:**
```javascript
new WebSocketService(httpServer)
```

**Events Broadcasted:**
- `sensor:update` - Real-time sensor data (pressure, flow, temperature, conductivity)
- `alert:new` - New leak detection alerts
- `server:pong` - Latency response (for ping/pong measurement)

**Events Handled:**
- `connection` - New client connects
- `client:initialize` - Client registration with name/type
- `client:ping` - Client latency measurement request
- `client:subscribe` - Subscribe to specific channels
- `client:unsubscribe` - Unsubscribe from channels
- `disconnect` - Client disconnection

#### REST Endpoints (`src/routes/websocket.js`)
- `GET /api/websocket/stats` - Connection statistics
- `POST /api/websocket/broadcast-alert` - Manually broadcast alert
- `POST /api/websocket/broadcast-data` - Broadcast custom data

### Frontend (React + Socket.io-Client)

#### WebSocket Context (`frontend/src/context/WebSocketContext.js`)
Global state management for real-time data with automatic reconnection.

**Key State:**
```javascript
{
  isConnected: boolean,              // Connection status
  connectionStatus: string,          // 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  latestSensorData: {                // Most recent sensor reading
    pressure: number,
    flow: number,
    temperature: number,
    conductivity: number
  },
  latestAlert: {                     // Most recent alert
    severity: string,
    message: string,
    leakProbability: number,
    timestamp: Date
  },
  latency: number,                   // Current ping/pong latency (ms)
  dataFreshness: number,             // Time since last sensor update (ms)
  connectionMetrics: {               // Connection statistics
    messagesReceived: number,
    messagesSent: number,
    reconnectAttempts: number,
    uptime: number
  }
}
```

**Key Methods:**
- `connect()` - Initiate WebSocket connection
- `disconnect()` - Close connection
- `subscribe(channels)` - Join room subscriptions
- `unsubscribe(channels)` - Leave rooms
- `getStatusColor()` - Get color based on connection state
- `getFormattedFreshness()` - Format data age (e.g., "2.5s ago")
- `getUptime()` - Calculate connection duration

#### Connection Status Component (`frontend/src/components/ConnectionStatus.js`)
Visual indicator showing connection health with detailed metrics.

**Features:**
- Real-time status indicator (connected/connecting/error/disconnected)
- Animated icons with pulse effects
- Latency display (ms)
- Data freshness display (e.g., "2.5s ago")
- Message count statistics
- Manual reconnect button
- Expandable details panel

#### Real-time Integration in Dashboard Components

All major components now display real-time metrics:

1. **Dashboard** - Real-time pressure/flow/temperature gauges
2. **HistoricalData** - Live sensor readings alongside historical data
3. **LeakAlertPanel** - Real-time alert indicator with latest alert details
4. **ValveControl** - Current sensor data for valve decision-making
5. **AIInsights** - Real-time anomaly score monitoring
6. **PredictiveMaintenance** - Real-time risk assessment based on live data

## Setup & Configuration

### Backend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start server:**
```bash
npm start
```

The server will start on `http://localhost:3000` with WebSocket endpoint at `ws://localhost:3000`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Update REACT_APP_WEBSOCKET_URL if backend is on different host/port
# Default: http://localhost:3000
```

3. **Start development server:**
```bash
npm start
```

## Usage Examples

### Using WebSocket Data in Components

```javascript
import { useContext } from 'react';
import { WebSocketContext } from '../context/WebSocketContext';

function MyComponent() {
  const {
    isConnected,
    latestSensorData,
    dataFreshness,
    getFormattedFreshness
  } = useContext(WebSocketContext);

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Pressure: {latestSensorData?.pressure} PSI</p>
      <p>Data age: {getFormattedFreshness()}</p>
    </div>
  );
}
```

### Handling Connection Changes

```javascript
useEffect(() => {
  if (isConnected) {
    console.log('WebSocket connected');
    // Use live data
  } else {
    console.log('WebSocket disconnected, using API fallback');
    // Use API data as fallback
  }
}, [isConnected]);
```

### Subscribing to Channels

```javascript
const { subscribe, unsubscribe } = useContext(WebSocketContext);

useEffect(() => {
  // Subscribe to specific channels
  subscribe(['pressure-alerts', 'high-flow']);

  return () => {
    unsubscribe(['pressure-alerts', 'high-flow']);
  };
}, []);
```

## Logging

All WebSocket operations are logged to the browser console with prefixes:
- `[WEBSOCKET]` - Backend WebSocket service logs
- `[WEBSOCKET CONTEXT]` - Frontend context provider logs
- `[DASHBOARD]` - Component-specific logs

Enable debug logging:
```bash
# Frontend - set REACT_APP_DEBUG=true in .env
# Backend - set NODE_ENV=development
```

## Performance Considerations

1. **Broadcast Frequency**: 2-second interval (configurable in `websocketService.js`)
2. **Latency Monitoring**: 5-second ping intervals
3. **Data Freshness**: Updated every 1 second in UI
4. **Memory**: Context uses React hooks for efficient re-renders

## Error Handling

### Automatic Reconnection
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
- Maximum 10 reconnection attempts
- User-friendly error messages

### Graceful Degradation
- Dashboard components fall back to REST API if WebSocket unavailable
- Alert polling continues even if WebSocket disconnects
- Manual retry button available in connection status

## API Broadcasting

Broadcast data to all connected clients via REST API:

```bash
# Broadcast alert
curl -X POST http://localhost:3000/api/websocket/broadcast-alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert": {
      "severity": "HIGH",
      "message": "High pressure detected",
      "leakProbability": 75,
      "location": "Main Line"
    }
  }'

# Broadcast custom data
curl -X POST http://localhost:3000/api/websocket/broadcast-data \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "custom:event",
    "data": { "value": 123 }
  }'

# Get connection statistics
curl http://localhost:3000/api/websocket/stats
```

## Monitoring

### Connection Status Dashboard
- Visual indicator in header showing connection health
- Click to expand and see detailed metrics:
  - Client ID
  - Latency (ping/pong)
  - Messages sent/received
  - Reconnection attempts
  - Data freshness
  - Current sensor values

### Console Logging
Monitor real-time operations in browser developer tools:
```
[WEBSOCKET CONTEXT] Connecting to ws://localhost:3000...
[WEBSOCKET CONTEXT] Connected with ID: abc123def
[WEBSOCKET CONTEXT] Received sensor:update event
[WEBSOCKET CONTEXT] Data freshness: 125ms
```

## Troubleshooting

### WebSocket not connecting
1. Verify backend is running on correct port (default 3000)
2. Check `REACT_APP_WEBSOCKET_URL` in `.env`
3. Verify CORS is enabled on backend
4. Check browser console for error messages

### High latency
1. Check network connection
2. Verify server is not overloaded
3. Review broadcast frequency in `websocketService.js`

### Data not updating
1. Check if `isConnected` is true in WebSocketContext
2. Verify component is using `latestSensorData` from context
3. Check browser console for error messages
4. Try manual reconnection via status button

### Memory leaks
1. Ensure useEffect cleanup functions are properly removing event listeners
2. Check that subscriptions are cleaned up on unmount
3. Verify Context provider is only mounted once in app tree

## Advanced Configuration

### Adjust Broadcast Frequency
In `src/services/websocketService.js`:
```javascript
const BROADCAST_INTERVAL = 2000; // Change to desired milliseconds
```

### Adjust Reconnection Strategy
In `frontend/src/context/WebSocketContext.js`:
```javascript
const MAX_RECONNECT_ATTEMPTS = 10; // Max retries
const RECONNECT_DELAYS = [1000, 2000, 4000, ...]; // Backoff strategy
```

### Adjust Ping Interval
In `frontend/src/context/WebSocketContext.js`:
```javascript
const PING_INTERVAL = 5000; // Milliseconds between latency checks
```

## Production Considerations

1. **HTTPS/WSS**: Use WSS (WebSocket Secure) in production
   - Update `REACT_APP_WEBSOCKET_URL` to `wss://...`
   - Enable SSL/TLS on server

2. **Load Balancing**: 
   - Configure Socket.io to work with multiple server instances
   - Use Redis adapter for cross-instance communication

3. **Rate Limiting**: 
   - Implement rate limiting on WebSocket events
   - Monitor connection counts

4. **Authentication**:
   - Add JWT token validation in connection handler
   - Implement per-user data filtering

5. **Monitoring**:
   - Track connection metrics over time
   - Alert on disconnection rates
   - Monitor latency trends

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── websocketService.js      # WebSocket service
│   ├── routes/
│   │   └── websocket.js             # WebSocket REST endpoints
│   ├── controllers/
│   │   └── websocketController.js   # WebSocket controller
│   └── index.js                     # Main app (updated for Socket.io)
└── package.json                     # Dependencies (socket.io added)

frontend/
├── src/
│   ├── context/
│   │   └── WebSocketContext.js      # Global WebSocket state
│   ├── components/
│   │   ├── ConnectionStatus.js      # Status indicator component
│   │   ├── Dashboard.js             # Updated with WebSocket
│   │   ├── HistoricalData.js        # Updated with WebSocket
│   │   ├── LeakAlertPanel.js        # Updated with WebSocket
│   │   ├── ValveControl.js          # Updated with WebSocket
│   │   ├── AIInsights.js            # Updated with WebSocket
│   │   └── PredictiveMaintenance.js # Updated with WebSocket
│   ├── styles/
│   │   └── ConnectionStatus.css     # Status component styling
│   ├── App.js                       # Updated with context provider
│   └── .env.example                 # Configuration template
└── package.json                     # Dependencies (socket.io-client added)
```

## Summary

The WebSocket integration provides:
- ✅ Real-time data streaming (2-second interval)
- ✅ Automatic reconnection with exponential backoff
- ✅ Latency monitoring (ping/pong)
- ✅ Connection status visibility
- ✅ Graceful fallback to REST API
- ✅ Comprehensive error handling
- ✅ All components display live metrics
- ✅ Detailed logging for debugging
- ✅ Production-ready architecture

## Support

For issues or questions:
1. Check browser console for error messages
2. Review server logs for backend issues
3. Verify network connectivity
4. Check connection status indicator for details

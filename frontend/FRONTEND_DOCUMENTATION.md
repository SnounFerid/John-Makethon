# React Frontend - Complete Documentation

## Overview

A production-ready React frontend for the Water Leak Detection System with 6 major components, state management, API integration, and comprehensive console logging.

## Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Create .env file
cp .env.example .env

# Start development server
npm start
```

Access the application at `http://localhost:3000`

## Architecture

### Components (6 Total)

#### 1. **Dashboard** (`src/components/Dashboard.js`)
- **Purpose**: Real-time system monitoring
- **Features**:
  - Live pressure, flow, temperature gauges
  - System status overview cards
  - Pressure & flow trend charts
  - Leak risk area chart
  - Recent alerts list
- **Data Refresh**: Every 5 seconds with simulated sensor data
- **Logging**: `[DASHBOARD]` prefix

#### 2. **HistoricalData** (`src/components/HistoricalData.js`)
- **Purpose**: Historical data analysis and visualization
- **Features**:
  - Date range filter
  - 4 individual metric charts (pressure, flow, temperature, combined)
  - Statistical summaries (count, averages)
  - CSV export functionality
  - Data table showing last 20 readings
- **Data Range**: Last 100 readings displayed in charts
- **Logging**: `[HISTORICAL DATA]` prefix

#### 3. **LeakAlertPanel** (`src/components/LeakAlertPanel.js`)
- **Purpose**: Alert management and tracking
- **Features**:
  - Active alerts display with severity coloring
  - Alert history with status indicators
  - Severity breakdown statistics
  - Recommended actions per alert
  - Auto-refresh every 10 seconds
- **Severity Levels**: CRITICAL (red), HIGH (orange), MEDIUM (yellow), LOW (blue)
- **Logging**: `[LEAK ALERT PANEL]` prefix

#### 4. **ValveControl** (`src/components/ValveControl.js`)
- **Purpose**: Valve operation and management
- **Features**:
  - Visual valve status indicator (open/closed/connected)
  - Open/Close action buttons with confirmation
  - Valve specification details (location, type, flow, etc.)
  - Operation history table
  - Safety information section
- **Safety**: Automatic button disable based on current state
- **Logging**: `[VALVE CONTROL]` prefix

#### 5. **AIInsights** (`src/components/AIInsights.js`)
- **Purpose**: ML-based anomaly detection analysis
- **Features**:
  - 4 key metric cards (anomaly score, leak probability, detections, confidence)
  - 4 detailed charts:
    - Anomaly score trends
    - Rule-based vs ML comparison
    - Combined leak probability
    - Probability distribution pie chart
  - ML model performance metrics
  - Top 10 detected anomalies ranking
  - System insights and recommendations
- **Algorithm**: Isolation Forest with performance metrics
- **Logging**: `[AI INSIGHTS]` prefix

#### 6. **PredictiveMaintenance** (`src/components/PredictiveMaintenance.js`)
- **Purpose**: Pipe degradation analysis and maintenance planning
- **Features**:
  - Risk summary cards (critical, medium, low)
  - Detailed pipe cards with:
    - Risk score (0-100%)
    - Location, material, age
    - Risk factors list
    - Recommended actions
  - Maintenance timeline (immediate, short-term, long-term)
  - System recommendations summary
- **Risk Categories**: Critical (70+), Medium (40-70), Low (<40)
- **Logging**: `[PREDICTIVE MAINTENANCE]` prefix

### State Management

**DetectionContext** (`src/context/DetectionContext.js`)
- Central state for all components
- Auto-initialization on mount
- Methods for data fetching and processing:
  - `fetchDetectionStatus()` - Current system status
  - `fetchRecentAlerts(limit)` - Alert retrieval
  - `fetchHistoricalData(filters)` - Time-series data
  - `fetchMaintenanceReport()` - Maintenance data
  - `processSensorReading(data)` - Process new reading
  - `controlValve(action)` - Valve operation
  - `filterDataByTimeRange(start, end)` - Data filtering
- Comprehensive logging with `[CONTEXT]` prefix

### API Client

**apiClient.js** (`src/services/apiClient.js`)
- Axios instance with base URL configuration
- Request/response interceptors with detailed logging
- Grouped endpoints by functionality:
  - **sensorAPI**: 4 endpoints (add, get, getById, getStats)
  - **mlAPI**: 3 endpoints (train, status, history)
  - **leakDetectionAPI**: 5 endpoints (status, predictions, valve control)
  - **detectionAPI**: 11 endpoints (initialize, process, batch, alerts, etc.)
  - **utilAPI**: 2 endpoints (docs, health)
- Error handling with detailed messages
- Console logging: `[API REQUEST]`, `[API RESPONSE]`, `[API ERROR RESPONSE]`

## Routing

**App.js** (`src/App.js`)
- React Router v6 configuration
- 6 main routes:
  - `/` → Dashboard
  - `/historical` → HistoricalData
  - `/alerts` → LeakAlertPanel
  - `/valve` → ValveControl
  - `/ai-insights` → AIInsights
  - `/maintenance` → PredictiveMaintenance
- Navigation bar with responsive menu
- Global footer with app info

## Styling

**CSS Files** (7 Total)
- `index.css` - Global styles, variables, utilities
- `App.css` - App layout, utilities, responsive
- `Dashboard.css` - Dashboard specific styles
- `HistoricalData.css` - Historical data component
- `LeakAlertPanel.css` - Alert panel styles
- `ValveControl.css` - Valve control styles
- `AIInsights.css` - AI insights styles
- `PredictiveMaintenance.css` - Maintenance styles

**Design System**:
- Color palette with CSS variables
- Responsive grid layouts
- Mobile-first approach
- Smooth transitions and animations
- Accessibility considerations

## Console Logging Reference

### API Layer
```
[API REQUEST] GET http://localhost:3000/api/detection/status
[API RESPONSE] 200 http://localhost:3000/api/detection/status
[API ERROR RESPONSE] Failed to fetch due to network error
```

### Context Layer
```
[CONTEXT] Initializing detection system
[CONTEXT] Processing sensor reading
[CONTEXT] Fetching recent alerts
[CONTEXT] Filtering data by time range
```

### Component Layer
```
[DASHBOARD] Component mounted
[DASHBOARD] Simulating new sensor reading
[HISTORICAL DATA] Applying date filter
[VALVE CONTROL] Performing action: open
[AI INSIGHTS] Refreshing predictions
[PREDICTIVE MAINTENANCE] Refreshing maintenance report
```

## Data Flow

### Real-Time Monitoring
```
Dashboard mounted
  ↓
fetchDetectionStatus() (context)
  ↓
GET /api/detection/status (API)
  ↓
Update currentReading & detectionStatus (state)
  ↓
Render gauges and status cards
  ↓
Every 5 seconds: processSensorReading() → simulate new data
```

### Alert Management
```
LeakAlertPanel mounted
  ↓
fetchRecentAlerts(20) (context)
  ↓
GET /api/detection/alerts (API)
  ↓
Update recentAlerts & alertHistory (state)
  ↓
Render active alerts and history
  ↓
Every 10 seconds: Auto-refresh fetchRecentAlerts()
```

### Valve Control
```
User clicks Open/Close button
  ↓
controlValve(action) (context)
  ↓
POST /api/valve-control (API)
  ↓
Update valveStatus (state)
  ↓
Render success/error message
  ↓
Update valve operation history
```

## Environment Configuration

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

## Dependencies

- **react** (18.2.0) - UI library
- **react-dom** (18.2.0) - DOM rendering
- **react-router-dom** (6.8.0) - Routing
- **axios** (1.3.0) - HTTP client
- **recharts** (2.5.0) - Charts and visualizations
- **react-icons** (4.7.1) - Icon library
- **date-fns** (2.29.2) - Date utilities

## Performance Optimizations

1. **Component Level**:
   - Lazy loading of routes
   - Memoization of expensive renders
   - Efficient state updates

2. **Data Level**:
   - Chart data limiting (last 100 samples)
   - Debounced filter operations
   - Pagination in tables

3. **Network Level**:
   - Request caching where applicable
   - Auto-refresh intervals (5s, 10s, 30s)
   - Error retry logic

## File Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.js (325 lines)
│   │   ├── HistoricalData.js (280 lines)
│   │   ├── LeakAlertPanel.js (265 lines)
│   │   ├── ValveControl.js (290 lines)
│   │   ├── AIInsights.js (360 lines)
│   │   └── PredictiveMaintenance.js (380 lines)
│   ├── context/
│   │   └── DetectionContext.js (320 lines)
│   ├── services/
│   │   └── apiClient.js (215 lines)
│   ├── styles/
│   │   ├── index.css (280 lines)
│   │   ├── App.css (150 lines)
│   │   ├── Dashboard.css (420 lines)
│   │   ├── HistoricalData.css (280 lines)
│   │   ├── LeakAlertPanel.css (450 lines)
│   │   ├── ValveControl.css (500 lines)
│   │   ├── AIInsights.css (380 lines)
│   │   └── PredictiveMaintenance.css (600 lines)
│   ├── App.js (100 lines)
│   └── index.js (15 lines)
├── package.json
├── README.md
├── .env.example
└── .gitignore
```

**Total Lines of Code**: ~5,800 lines (excluding comments)

## Features Implemented

✅ Real-time dashboard with live gauges
✅ Historical data visualization with filters
✅ Leak alert management with severity levels
✅ Valve control with safety features
✅ AI insights with ML predictions
✅ Predictive maintenance planning
✅ Context-based state management
✅ Comprehensive API client with logging
✅ Responsive design for all devices
✅ Console logging for debugging
✅ Error handling and validation
✅ Auto-refresh capabilities
✅ CSV export functionality
✅ Chart data visualization
✅ Status indicators and badges

## Testing

Run tests (when configured):
```bash
npm test
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Deployment

### Static Hosting (Vercel, Netlify)
```bash
npm run build
# Deploy build/ folder
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

## Troubleshooting

### API Connection Issues
- Verify backend is running
- Check `.env` file configuration
- Review browser console for error logs
- Test with direct API calls using curl/Postman

### State Management Issues
- Check Context Provider wrapping App
- Verify useContext hook usage
- Review console logs for state changes
- Check for circular dependencies

### Chart Rendering Issues
- Ensure Recharts is properly installed
- Check data format matches chart expectations
- Verify ResponsiveContainer has parent height
- Clear browser cache if charts disappear

### Performance Issues
- Profile with React DevTools
- Check for memory leaks
- Reduce chart data range
- Monitor API response times
- Optimize re-renders with React.memo

## Future Enhancements

- [ ] WebSocket for real-time updates
- [ ] User authentication
- [ ] Custom alert configuration
- [ ] Advanced data filtering
- [ ] Dark mode support
- [ ] Mobile app with React Native
- [ ] Offline mode with service workers
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Advanced analytics dashboard

## Support

For issues, check:
1. Backend API is running and accessible
2. Browser console for error messages
3. API response format matches expectations
4. Environment variables are set correctly
5. Backend logs for processing errors

## License

MIT

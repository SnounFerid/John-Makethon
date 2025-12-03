# Water Leak Detection System - React Frontend

A comprehensive React-based frontend for the Water Leak Detection System, featuring real-time monitoring, AI-powered insights, and predictive maintenance analysis.

## Features

### 📊 Real-Time Dashboard
- Live pressure, flow rate, and temperature gauges
- System status overview with leak probability indicators
- Interactive charts showing pressure and flow trends
- Leak risk analysis with visual representations
- Recent alerts summary with severity indicators

### 📈 Historical Data Visualization
- Time-range selector for flexible data filtering
- Multi-metric charts (pressure, flow, temperature)
- CSV export functionality for data analysis
- Comprehensive data table with historical readings
- Statistical summaries (average, trends)

### 🚨 Leak Alert Management
- Active alerts panel with severity-based coloring
- Alert history with status tracking
- Detailed alert information (probability, location, timestamp)
- Recommended actions for each alert
- Alert statistics and severity breakdown

### 🔧 Valve Control Interface
- Real-time valve status display (open/closed)
- One-click open/close controls
- Valve operation history with timestamps
- Safety information and warnings
- Connection status monitoring

### 🧠 AI Insights & Predictions
- Anomaly score trends visualization
- Detection methods comparison (rule-based vs ML)
- ML model performance metrics
- Top detected anomalies ranking
- Leak probability distribution analysis

### 🛠️ Predictive Maintenance
- Risk assessment for all pipe segments
- Categorized pipes by risk level (critical, medium, low)
- Maintenance timeline with urgency levels
- Recommended actions with implementation timelines
- Risk factor analysis for each pipe

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.js
│   │   ├── HistoricalData.js
│   │   ├── LeakAlertPanel.js
│   │   ├── ValveControl.js
│   │   ├── AIInsights.js
│   │   └── PredictiveMaintenance.js
│   ├── context/
│   │   └── DetectionContext.js
│   ├── services/
│   │   └── apiClient.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Dashboard.css
│   │   ├── HistoricalData.css
│   │   ├── LeakAlertPanel.css
│   │   ├── ValveControl.css
│   │   ├── AIInsights.css
│   │   └── PredictiveMaintenance.css
│   ├── App.js
│   └── index.js
└── package.json
```

## Installation

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure backend API URL:**
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:3000/api
```

3. **Start the development server:**
```bash
npm start
```

The application will open at `http://localhost:3000`

## API Integration

The frontend communicates with the backend through a centralized API client with comprehensive logging.

### API Endpoints Used

**Sensor Data:**
- `POST /api/sensor-data` - Add new reading
- `GET /api/sensor-data` - Fetch readings with filters
- `GET /api/sensor-data/stats` - Get statistics

**Leak Detection:**
- `GET /api/leak-detection` - Detection status
- `GET /api/leak-detection/predictions` - Predictions
- `POST /api/valve-control` - Control valve
- `GET /api/valve-control/status` - Valve status
- `GET /api/valve-control/history` - Valve history

**Integrated Detection:**
- `POST /api/detection/initialize` - Initialize system
- `POST /api/detection/process` - Process reading
- `GET /api/detection/status` - Detection status
- `GET /api/detection/alerts` - Recent alerts
- `GET /api/detection/report` - Comprehensive report
- `GET /api/detection/maintenance-report` - Maintenance data

## Console Logging

All API calls and state changes are logged to the browser console for debugging. Look for prefixes:
- `[API REQUEST]` - Outgoing API requests
- `[API RESPONSE]` - Successful responses
- `[API ERROR RESPONSE]` - Error responses
- `[CONTEXT]` - Context state changes
- `[DASHBOARD]` - Dashboard component events
- `[HISTORICAL DATA]` - Historical data events
- `[ALERT PANEL]` - Alert panel events
- `[VALVE CONTROL]` - Valve control events
- `[AI INSIGHTS]` - AI insights events
- `[PREDICTIVE MAINTENANCE]` - Maintenance events

## Components

### Dashboard
The main landing page displaying real-time system status with gauges, charts, and alerts.

**Key Features:**
- Live sensor value gauges (pressure, flow, temperature)
- System status cards
- Trend charts with historical data
- Recent alerts list

### HistoricalData
Analyze historical sensor readings with flexible filtering and visualization.

**Key Features:**
- Date range selector
- Multiple metric charts
- Statistical summaries
- CSV export
- Data table with pagination

### LeakAlertPanel
Manage and track all leak detection alerts.

**Key Features:**
- Active alerts display
- Alert history with status tracking
- Severity-based categorization
- Alert statistics and metrics

### ValveControl
Manual valve control interface with operation history.

**Key Features:**
- Open/close controls
- Current status display
- Safety information
- Operation history table
- Response time monitoring

### AIInsights
Visualize AI-based anomaly detection and ML model performance.

**Key Features:**
- Anomaly score trends
- Detection method comparison
- Model performance metrics
- Probability distribution
- Top anomalies ranking

### PredictiveMaintenance
Plan maintenance based on pipe degradation analysis.

**Key Features:**
- Risk categorization
- Pipe segment cards with details
- Risk factor analysis
- Maintenance timeline
- Recommended actions

## Context Management

The `DetectionContext` manages application state including:
- Current sensor readings
- Detection status and alerts
- Valve control state
- Historical data
- Maintenance reports
- User actions

## Styling

The application uses a modern, responsive design with:
- CSS Grid and Flexbox layouts
- Consistent color scheme
- Mobile-responsive design
- Smooth transitions and animations
- Accessibility considerations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm build

# Run tests
npm test
```

### Environment Variables

- `REACT_APP_API_URL` - Backend API base URL (default: http://localhost:3000/api)

## Performance Optimizations

- Component lazy loading
- Memoization of expensive computations
- Debounced API calls
- Chart data limiting (last 100 samples)
- Responsive image sizing

## Future Enhancements

- WebSocket support for real-time updates
- User authentication and authorization
- Advanced data filtering and search
- Custom alert rules configuration
- Predictive analytics for failure prevention
- Integration with external monitoring systems
- Mobile app using React Native
- Dark mode support
- Multi-language support

## Troubleshooting

### API Connection Issues
1. Check backend is running on `http://localhost:3000`
2. Verify `REACT_APP_API_URL` in `.env`
3. Check browser console for `[API ERROR RESPONSE]` logs

### Missing Data
1. Ensure sensor data is being sent to backend
2. Check that detection engine is initialized
3. Review backend logs for processing errors

### Performance Issues
1. Open DevTools Performance tab
2. Check for memory leaks in console
3. Reduce chart data range
4. Clear browser cache

## License

MIT

## Support

For issues or questions, refer to the backend documentation or contact the development team.

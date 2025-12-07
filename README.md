# 💧 Water Leak Detection System
## Real-Time AI-Powered Anomaly Detection & Alert Management

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [AI Systems Architecture](#ai-systems-architecture)
3. [System Components](#system-components)
4. [Prerequisites & Installation](#prerequisites--installation)
5. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
6. [Training the AI Models](#training-the-ai-models)
7. [Simulating Pipes & Leaks](#simulating-pipes--leaks)
8. [Dashboard & Features](#dashboard--features)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

The **Water Leak Detection System** is an intelligent platform that monitors water distribution networks in real-time using dual AI models to detect leaks before they cause significant damage. The system combines **LSTM-based anomaly detection**, **regression-based predictive maintenance**, and **rule-based thresholds** to achieve high accuracy leak identification with minimal false positives.

### Key Features

✅ **Real-Time Monitoring** - Live sensor data ingestion via WebSocket  
✅ **Dual AI Detection** - LSTM (40%) + Regression (30%) + Rule-Based (30%)  
✅ **Smart Alerts** - Severity-based classification (CRITICAL, HIGH, MEDIUM, MINOR, NORMAL)  
✅ **Manual Valve Control** - Intuitive UI for emergency response  
✅ **Historical Analysis** - Time-range filtering, statistical summaries, CSV export  
✅ **Automatic Model Training** - On-demand training with prepared datasets  
✅ **Responsive Dashboard** - React-based operator interface with real-time updates

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Node.js + Express | REST API, ML integration, WebSocket server |
| **Frontend** | React 18 | Interactive dashboard, real-time monitoring |
| **Database** | SQLite | Sensor data, alerts, audit logs |
| **ML Models** | TensorFlow.js | LSTM anomaly detection, trained on water system patterns |
| **Communication** | WebSocket | Real-time data streaming to dashboard |

---

## 🧠 AI Systems Architecture

### 1. LSTM Anomaly Detector (40% Weight)

**Purpose:** Detect unusual patterns in real-time sensor sequences

**How It Works:**
- Maintains a rolling 30-point buffer of sensor readings (pressure, flow, temperature)
- Passes buffer through a trained Long Short-Term Memory (LSTM) neural network
- LSTM learns normal temporal patterns during training phase
- Any deviation from learned patterns triggers an anomaly score (0-100%)

**Key Metrics:**
- **Input**: Last 30 sensor readings
- **Output**: Anomaly probability (0-100%)
- **Update Frequency**: Every new sensor reading (~real-time)
- **Training Data**: 10,000+ normal operation samples from `backend/training_data/`

**Example Scenario:**
- Normal pressure: 45-50 PSI, stable
- Sudden drop: 45 → 20 PSI in 2 seconds
- LSTM detects pattern deviation → anomaly score: 85%

### 2. Regression Maintenance Model (30% Weight)

**Purpose:** Predict system failure probability and time-to-failure

**How It Works:**
- Uses polynomial regression on historical failure patterns
- Analyzes pressure trend, flow rate changes, temperature gradients
- Produces failure probability score (0-100%) AND estimated hours-to-failure
- Lower scores with stable patterns, higher scores with degradation trends

**Key Metrics:**
- **Input**: Pressure, flow, temperature, wear indicators
- **Output**: Failure probability (0-100%) + estimated hours
- **Forecast Horizon**: 1-168 hours (up to 1 week)
- **Training Data**: Real maintenance records and simulated degradation

**Example Scenario:**
- Gradual pressure decline over 2 hours: 50 → 48 → 45 PSI
- Model predicts: 65% failure risk, ~48 hours to catastrophic failure
- Operators get proactive alert to schedule maintenance

### 3. Rule-Based Detection (30% Weight)

**Purpose:** Apply traditional physical thresholds and relationships

**How It Works:**
- Checks hard limits: pressure < 1.0 PSI = possible major leak
- Validates pressure-flow relationship: flow should scale with pressure
- Detects anomalous ratios: deviation > 25% = risk indicator
- Executes in <5ms (fastest of three methods)

**Key Thresholds:**
| Condition | Score |
|-----------|-------|
| Pressure drop >10% | CRITICAL (90%) |
| Flow-pressure mismatch | HIGH (75%) |
| Ratio deviation >25% | MEDIUM (60%) |
| All normal | LOW (20%) |

**Example Scenario:**
- Normal: 50 PSI input, 20 GPM output
- Leak detected: 50 PSI input, 30 GPM output (40% flow spike with same pressure)
- Rule-based score: 75% (flow increased abnormally)

### 4. Combined Score Calculation

```
Final Score = (LSTM × 0.4) + (Regression × 0.3) + (RuleBased × 0.3)
```

**Alert Severity Levels:**
| Probability | Severity | Action | Response Time |
|------------|----------|--------|----------------|
| ≥ 80% | 🔴 CRITICAL | Immediate isolation | < 5 minutes |
| ≥ 65% | 🟠 HIGH | Urgent inspection | < 1 hour |
| ≥ 50% | 🟡 MEDIUM | Schedule inspection | < 24 hours |
| ≥ 35% | 🟢 MINOR | Monitor closely | Routine |
| < 35% | ✅ NORMAL | Continue operations | N/A |

---

## 🏗️ System Components

### Backend Architecture
```
Node.js/Express Server
├── REST API Layer (/api/*)
│   ├── Sensor data ingestion
│   ├── Detection processing
│   ├── Alert management
│   └── Model training
├── WebSocket Server
│   └── Real-time data streaming
├── ML Integration Layer
│   ├── LSTM model loader
│   ├── Regression engine
│   └── Rule-based checker
└── SQLite Database
    ├── sensor_data table
    ├── alerts table
    └── audit_logs table
```

### Frontend Architecture
```
React Dashboard
├── Real-Time Gauges
│   ├── Pressure (PSI)
│   ├── Flow (GPM)
│   └── Temperature (°C)
├── Detection Charts
│   ├── Pressure trend
│   ├── Flow trend
│   └── Leak probability
├── Alert Management
│   ├── Active alerts
│   ├── Alert history
│   └── Statistics
├── Manual Valve Control
│   ├── Valve state display
│   ├── Open/Close buttons
│   └── Operational history
└── Historical Data
    ├── Time-range filter
    ├── Statistical summary
    ├── Export to CSV
    └── Data table
```

---

## 📦 Prerequisites & Installation

### System Requirements
- **OS**: Windows 10/11, macOS, or Linux
- **Node.js**: Version 16.x or later ([Download](https://nodejs.org/))
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: 200MB for node_modules + models
- **Port Availability**: 3000 (backend), 3001 (frontend)

### Step 1: Verify Node.js Installation
```powershell
# Check Node.js version
node --version  # Should be v16.x or higher

# Check npm version
npm --version   # Should be v8.x or higher
```

### Step 2: Clone or Navigate to Project
```powershell
# Navigate to project root (where README.md is located)
cd "c:\path\to\John-Makethon"
```

### Step 3: Install Dependencies
```powershell
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Verify installation
npm list --depth=0
```

---

## 🚀 Step-by-Step Setup Guide

### Setup Phase 1: Start the Backend Server

Open a **PowerShell terminal** in the project root:

```powershell
# Terminal 1: Backend
node src/index.js
```

**Expected Output:**
```
[STARTUP] ✅ Server running on port 3000
[STARTUP] ✅ Dual AI Detection Engine Ready
[STARTUP] • LSTM Model Loaded: true
[STARTUP] • Regression Model Loaded: true
[STARTUP] ✅ WebSocket Server Running
```

**What's Running:**
- REST API listening on `http://localhost:3000`
- WebSocket server ready for client connections
- SQLite database initialized at `./db/sensor_data.db`
- ML models preloaded in memory

### Setup Phase 2: Start the Frontend Dashboard

Open a **new PowerShell terminal** in the project root:

```powershell
# Terminal 2: Frontend
cd frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
On Your Network:  http://192.168.x.x:3001
Localhost:        http://localhost:3001
```

**What to See:**
- Browser automatically opens to `http://localhost:3001`
- Dashboard displays with empty charts (waiting for sensor data)
- WebSocket status shows "Connecting..."

### Setup Phase 3: Verify System is Ready

In the dashboard, check:
1. **System Status Card** shows "Monitoring"
2. **Active Alerts** shows 0
3. **WebSocket indicator** shows "Connected" (green)

---

## 🧠 Training the AI Models

### Training Phase 1: Prepare Training Data

This step processes raw CSV files from `backend/training_data/` and extracts ML features:

```powershell
# Terminal 3: Data Preparation
node backend/scripts/prepareTrainingData.js
```

**Process:**
1. Reads all CSV files from `backend/training_data/` subdirectories
2. Applies data cleaning (removes nulls, normalizes ranges)
3. Engineers features (pressure derivatives, flow ratios, thermal indicators)
4. Outputs combined dataset to: `backend/training_data/processed/combined_training_data.json`

**Expected Output:**
```
[PREPROCESSOR] ✓ Loaded: 10,245 samples from maintenance_data/
[PREPROCESSOR] ✓ Features engineered
[PREPROCESSOR] ✓ Output saved: combined_training_data.json
```

**Duration:** 5-15 seconds depending on dataset size

### Training Phase 2: Train LSTM Model

```powershell
# Terminal 3: Model Training
node backend/scripts/trainModel.js
```

**What Happens:**
1. Loads combined training data
2. Splits into 80% training, 20% validation
3. Creates LSTM neural network architecture
4. Trains for 50 epochs with early stopping
5. Evaluates on validation set
6. Saves model to: `backend/models/lstm_anomaly_detector.json`

**Expected Output:**
```
[LSTM TRAINER] Training started...
[LSTM TRAINER] Epoch 1/50: loss=0.45, val_loss=0.42
[LSTM TRAINER] Epoch 25/50: loss=0.12, val_loss=0.14
[LSTM TRAINER] Epoch 50/50: loss=0.08, val_loss=0.09
[LSTM TRAINER] ✅ Model trained successfully!
[LSTM TRAINER] Validation Accuracy: 92.5%
[LSTM TRAINER] Model saved: lstm_anomaly_detector.json (8.2 MB)
```

**Duration:** 2-5 minutes depending on hardware

### Training Phase 3: Train Regression Model

```powershell
# Terminal 3: Regression Training
node backend/scripts/trainModel.js
```

This trains the secondary regression model for failure prediction:

**Expected Output:**
```
[REGRESSION TRAINER] Analyzing wear patterns...
[REGRESSION TRAINER] Training polynomial regression...
[REGRESSION TRAINER] ✅ Model trained successfully!
[REGRESSION TRAINER] Prediction accuracy: 89.3%
[REGRESSION TRAINER] Model saved: regression_maintenance_model.json
```

**Duration:** 1-2 minutes

### Alternative: Train via Backend API

If backend is running, you can trigger training via REST API:

```powershell
# One-command training (requires backend running)
curl -X POST http://localhost:3000/api/train-model `
  -H "Content-Type: application/json" `
  -d '{ "source": "prepared" }'
```

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully",
  "model": "lstm_anomaly_detector.json",
  "accuracy": 0.925,
  "timestamp": "2025-12-07T10:30:45Z"
}
```

---

## 🔄 Simulating Pipes & Leaks

Simulators generate realistic sensor data to test the detection system. Two tools are available:

### Simulator 1: Normal Operation Stream

Generates continuous baseline data (no leaks):

```powershell
# Terminal 3: Normal Operation (runs continuously)
node tools/simulatePipes.js
```

**Generates:**
- Pressure: 45-55 PSI (stable)
- Flow: 18-22 GPM (normal)
- Temperature: 20-25°C (ambient)
- Updates every 500ms
- Continues until Ctrl+C

**Use Case:** 
- Test dashboard responsiveness
- Establish baseline monitoring
- Generate normal training data

**Expected Output:**
```
[SIMULATOR] Sending reading: pressure=48.5 PSI, flow=20.2 GPM
[SIMULATOR] Sending reading: pressure=49.1 PSI, flow=19.8 GPM
[SIMULATOR] Sending reading: pressure=48.8 PSI, flow=20.1 GPM
```

### Simulator 2: Leak Scenarios

Simulates different leak types with controlled intensity:

#### Minor Leak (Small Hole)
```powershell
# 20 samples at 500ms intervals
node tools/simulateLeak.js minor 20 500
```

**Characteristics:**
- Pressure: 45-48 PSI (slight drop)
- Flow: 22-26 GPM (minor increase)
- Combined probability: 35-50% (MINOR/MEDIUM alert)

**Expected Output:**
```
[SIMULATOR] Leak Scenario: MINOR
[SIMULATOR] Reading 1/20: pressure=48.5, flow=20.5 → prob=28%
[SIMULATOR] Reading 10/20: pressure=46.2, flow=22.1 → prob=42%
[SIMULATOR] Reading 20/20: pressure=44.8, flow=24.3 → prob=48%
```

#### Major Leak (Pipe Fracture)
```powershell
# 30 samples at 1000ms intervals
node tools/simulateLeak.js major 30 1000
```

**Characteristics:**
- Pressure: 45 → 35 PSI (20% drop)
- Flow: 20 → 35 GPM (75% increase)
- Combined probability: 65-80% (HIGH alert)

**Expected Output:**
```
[SIMULATOR] Leak Scenario: MAJOR
[SIMULATOR] Reading 1/30: pressure=45.0, flow=20.0 → prob=15%
[SIMULATOR] Reading 15/30: pressure=38.5, flow=32.1 → prob=72%
[SIMULATOR] Reading 30/30: pressure=32.0, flow=41.5 → prob=78%
```

#### Pipe Burst (Catastrophic)
```powershell
# 50 samples at 200ms intervals (high velocity)
node tools/simulateLeak.js burst 50 200
```

**Characteristics:**
- Pressure: 45 → 15 PSI (67% drop)
- Flow: 20 → 60+ GPM (300% increase)
- Combined probability: 85-95% (CRITICAL alert)

**Expected Output:**
```
[SIMULATOR] Leak Scenario: BURST
[SIMULATOR] Reading 1/50: pressure=45.0, flow=20.0 → prob=25%
[SIMULATOR] Reading 25/50: pressure=22.1, flow=48.3 → prob=88%
[SIMULATOR] Reading 50/50: pressure=15.2, flow=62.5 → prob=92%
```

### Complete Testing Workflow

1. **Start everything:**
```powershell
# Terminal 1: Backend
node src/index.js

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Simulate
node tools/simulatePipes.js  # Start with normal baseline
```

2. **Observe baseline (30 seconds):**
   - Gauges show stable values
   - Charts fill with normal pattern
   - No alerts in Alert section

3. **Trigger minor leak scenario (in new terminal):**
```powershell
node tools/simulateLeak.js minor 20 500
```
   - Dashboard updates with new readings
   - Leak probability gradually increases
   - Minor alert may appear (< 35% = normal)

4. **Trigger major leak (in new terminal):**
```powershell
node tools/simulateLeak.js major 30 1000
```
   - Pressure drops visibly
   - Flow increases sharply
   - Alert with HIGH severity appears
   - Dashboard shows leak risk area chart spike

5. **Trigger pipe burst (in new terminal):**
```powershell
node tools/simulateLeak.js burst 100 200
```
   - Immediate pressure collapse
   - Massive flow spike
   - CRITICAL alert triggers
   - Recommend valve closure in alert message

---

## 📊 Dashboard & Features

### Real-Time Monitoring Section

**System Status Cards:**
- **System Status**: Current operational mode (Monitoring/Alert/Error)
- **Active Alerts**: Count of unresolved alerts by severity
- **Leak Probability**: Current combined detection score (%)

**Real-Time Gauges:**
- **Pressure (PSI)**: 0-100 PSI scale, color-coded by risk
- **Flow Rate (GPM)**: 0-200 GPM scale
- **Temperature (°C)**: 0-80°C scale

### Detection Charts

**Pressure & Flow Trends:**
- Line chart showing last 50 readings
- Real-time updates every second
- Dual Y-axis (pressure in blue, flow in green)

**Leak Risk Analysis:**
- Area chart showing leak probability over time
- Color gradient: green (safe) → orange (alert) → red (critical)

### Alert Management

**Active Alerts Panel:**
- Displays most recent 5 unresolved alerts
- Severity badge (CRITICAL/HIGH/MEDIUM/MINOR)
- Detection timestamp and probability
- Recommended actions

**Alert Details:**
- Click alert to view full details
- See which AI model triggered detection
- View sensor values at alert time

### Manual Valve Control

**Valve State Indicator:**
- Large valve icon (green=OPEN, red=CLOSED)
- Shows current operational state
- Last action timestamp

**Control Buttons:**
- 🟢 **Open Valve** - Resume normal operation
- 🔴 **Close Valve** - Emergency isolation

**Critical Information:**
- ✅ When OPEN: "System is reading sensor data"
- ⛔ When CLOSED: "System is NOT reading any sensor data"
- All dashboard values show 0 when valve is closed

### Historical Data Tab

**Time-Range Filtering:**
- Start date / End date picker
- Apply filter to narrow dataset

**Statistical Summary:**
- Total records displayed
- Average pressure, flow, temperature
- Real-time when valve is OPEN, zeros when CLOSED

**Data Visualization:**
- Pressure trend chart (last 100 readings)
- Flow trend chart (last 100 readings)
- Temperature trend chart

**Data Export:**
- CSV export button downloads all filtered data
- Format: Timestamp, Pressure, Flow, Temperature, Conductivity

**Data Table:**
- Last 20 readings in table format
- Sortable columns
- Shows all optional fields (conductivity, etc.)

---

## 🔌 API Reference

### Detection Endpoints

#### Process Sensor Reading
```
POST /api/detection/process
Content-Type: application/json

{
  "pressure": 48.5,
  "flow": 20.2,
  "temperature": 22,
  "conductivity": 250
}

Response: 201 Created
{
  "id": "det_abc123",
  "timestamp": "2025-12-07T10:30:45Z",
  "detectionResultSummary": {
    "overallLeakDetected": false,
    "overallProbability": 28,
    "severityLevel": "NORMAL",
    "detectionMethods": [
      {
        "method": "lstm_anomaly",
        "probability": 15,
        "isAnomaly": false
      },
      {
        "method": "regression_maintenance",
        "probability": 5,
        "estimatedHoursToFailure": 720
      },
      {
        "method": "rule_based",
        "probability": 50,
        "severity": "LOW"
      }
    ]
  }
}
```

#### Get System Status
```
GET /api/detection/status

Response: 200 OK
{
  "status": "Monitoring",
  "modelsLoaded": {
    "lstm": true,
    "regression": true,
    "ruleBased": true
  },
  "uptime": 3600,
  "alertCount": 2
}
```

#### Get Recent Detections
```
GET /api/detection/detections?limit=50

Response: 200 OK
{
  "data": [
    {
      "id": "det_abc123",
      "timestamp": "...",
      "readings": { "pressure": 48.5, "flow": 20.2 },
      "detection": { "overallProbability": 28, "severityLevel": "NORMAL" }
    },
    ...
  ],
  "total": 450
}
```

### Alert Endpoints

#### Get Active Alerts
```
GET /api/detection/alerts?severity=CRITICAL,HIGH

Response: 200 OK
{
  "data": [
    {
      "id": "alr_xyz789",
      "severity": "HIGH",
      "message": "Significant pressure drop detected",
      "timestamp": "2025-12-07T10:35:22Z",
      "probability": 72,
      "status": "active"
    }
  ],
  "total": 5
}
```

#### Acknowledge Alert
```
POST /api/detection/alerts/:alertId/acknowledge
Content-Type: application/json

{
  "notes": "Valve already closed, maintenance scheduled"
}

Response: 200 OK
{ "success": true, "alertId": "alr_xyz789", "status": "acknowledged" }
```

### Model Training

#### Train Models
```
POST /api/train-model
Content-Type: application/json

{
  "source": "prepared"
}

Response: 201 Created
{
  "success": true,
  "models": {
    "lstm": "lstm_anomaly_detector.json",
    "regression": "regression_maintenance_model.json"
  },
  "accuracy": { "lstm": 0.925, "regression": 0.893 },
  "timestamp": "2025-12-07T10:40:00Z"
}
```

### Valve Control

#### Get Valve Status
```
GET /api/valve/status

Response: 200 OK
{
  "success": true,
  "data": {
    "state": "OPEN",
    "lastUpdated": "2025-12-07T10:30:00Z",
    "lastAction": "OPEN"
  }
}
```

#### Control Valve
```
POST /api/valve/control
Content-Type: application/json

{
  "operation": "CLOSE"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "state": "CLOSED",
    "timestamp": "2025-12-07T10:35:00Z"
  }
}
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error:** "Port 3000 already in use"

**Solution:**
```powershell
# Option 1: Use different port
$env:PORT=4000
node src/index.js

# Option 2: Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend

**Symptom:** Dashboard shows "Disconnected" (red indicator)

**Solution:**
1. Verify backend is running: `http://localhost:3000/api/detection/status` in browser
2. Check port mismatch - frontend looks for backend on port 3000 by default
3. Check firewall - allow Node.js through Windows Defender

```powershell
# Verify backend is responding
curl http://localhost:3000/api/detection/status
```

### No Sensor Data Appearing in Dashboard

**Symptom:** Charts are empty, gauges show 0

**Solution:**
1. Start simulator in a new terminal:
```powershell
node tools/simulatePipes.js
```
2. Verify simulator is posting data:
```powershell
curl -X POST http://localhost:3000/api/sensor-data `
  -H "Content-Type: application/json" `
  -d '{"pressure":48,"flow":20,"temperature":22}'
```

### Models Not Training

**Symptom:** Training script exits without output

**Solution:**
1. Verify training data exists:
```powershell
dir backend/training_data/
```
2. Check Node.js memory:
```powershell
node -e "console.log(require('os').totalmem() / 1024 / 1024 / 1024, 'GB')"
```
3. Run with increased memory:
```powershell
node --max-old-space-size=2048 backend/scripts/trainModel.js
```

### High False Positive Rate

**Symptom:** Too many MEDIUM/MINOR alerts on normal data

**Solution:**
1. Retrain models with more diverse data
2. Increase weights on regression model (more predictive)
3. Raise thresholds in `utils/dualAIIntegratedEngine.js`:

```javascript
// Increase severity thresholds
if (probability >= 85) return 'CRITICAL';  // was 80
if (probability >= 70) return 'HIGH';      // was 65
if (probability >= 55) return 'MEDIUM';    // was 50
if (probability >= 40) return 'MINOR';     // was 35
```

---

## 📞 Support & Next Steps

### Getting Help

- **Dashboard Issues**: Check browser console (F12 → Console tab)
- **Backend Logs**: Terminal running `node src/index.js` shows all server activity
- **Model Performance**: Check `backend/models/model_config.json` for metrics

### Recommended Workflows

**First Time:**
1. Start backend & frontend
2. Run normal baseline simulator
3. Observe charts populating
4. Test with `minor` leak scenario
5. Verify alert appears

**Production Setup:**
1. Train models with your real data
2. Validate accuracy on test set
3. Deploy backend on cloud server
4. Configure frontend BACKEND_URL for production
5. Set up automated model retraining (weekly)

### Future Enhancements

- [ ] Persist alerts to database (currently in-memory)
- [ ] Multi-location valve support
- [ ] Email/SMS notifications
- [ ] Model performance tracking dashboard
- [ ] API key authentication
- [ ] Docker containerization

---

**Ready to detect leaks? Start with Step 1 in [Setup Guide](#-step-by-step-setup-guide)!** 🚀

# ⚡ Quick Start - Dual AI Leak Detection System

## 🎯 What You Have

Two AI models working together to detect leaks:

1. **LSTM** (40% weight) - Catches anomalies in real-time sensor sequences
2. **Regression** (30% weight) - Predicts failures before they happen
3. **Rule-Based** (30% weight) - Traditional pressure/flow rules

---

## 🚀 Quick Start (5 minutes)

### Step 1: Train Models (if not already done)
```bash
node tools/trainDualAIModels.js
```
Creates:
- `models/lstm_anomaly_detector.json` (8.20 MB)
- `models/regression_maintenance_model.json` (~1 KB)

### Step 2: Start Backend
```bash
node src/index.js
```
Watch for:
```
[STARTUP] ✅ Dual AI Detection Engine Ready
[STARTUP] • LSTM Model Loaded: true
[STARTUP] • Regression Model Loaded: true
```

### Step 3: Test with Simulation
```bash
# Terminal 1: Backend running (from Step 2)

# Terminal 2: Normal operation
node tools/simulateLeak.js normal 20 500

# Expected output:
# Combined Probability: 5-15% (NORMAL)
```

```bash
# Terminal 2: Major leak
node tools/simulateLeak.js major 20 500

# Expected output:
# Combined Probability: 65-80% (HIGH/CRITICAL)
```

---

## 🔌 API Endpoints

### POST `/api/detection/process`
Send sensor reading and get leak detection
```bash
curl -X POST http://localhost:3000/api/detection/process \
  -H "Content-Type: application/json" \
  -d '{
    "pressure": 48,
    "flow": 20,
    "temperature": 22,
    "conductivity": 250
  }'
```

**Response**:
```json
{
  "id": "det_abc123",
  "timestamp": "2025-12-07T...",
  "detectionResultSummary": {
    "overallLeakDetected": false,
    "overallProbability": 28,
    "severityLevel": "MINOR",
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
        "severity": "MEDIUM"
      }
    ]
  }
}
```

### GET `/api/detection/status`
Check system status
```bash
curl http://localhost:3000/api/detection/status
```

---

## 📊 Alert Severity Levels

| Level | Probability | Action |
|-------|-------------|--------|
| 🔴 CRITICAL | ≥ 80% | Immediate inspection, isolate section |
| 🟠 HIGH | ≥ 65% | Urgent inspection within 1-2 hours |
| 🟡 MEDIUM | ≥ 50% | Schedule inspection within 24 hours |
| 🟢 MINOR | ≥ 35% | Monitor system closely |
| ✅ NORMAL | < 35% | Continue normal operations |

---

## 📈 Understanding the Output

Each detection result contains 3 detection methods:

### 1. LSTM Anomaly (40% weight)
- **What**: Detects unusual patterns in sensor sequences
- **Range**: 0-100%
- **Fast**: Updates every ~30 seconds
- **Example**: Sudden pressure drop detected → 85%

### 2. Regression Maintenance (30% weight)
- **What**: Predicts system failure probability
- **Range**: 0-100%
- **Forecast**: Estimates hours until failure
- **Example**: High wear detected → 65% risk, 48 hours to failure

### 3. Rule-Based Detection (30% weight)
- **What**: Traditional pressure/flow thresholds
- **Range**: 0-100%
- **Rules**: 
  - Pressure drop >10% = CRITICAL LEAK
  - Flow-pressure mismatch = anomaly
  - Ratio deviation >25% = risk

### Combined Score
```
Combined = (LSTM × 0.4) + (Regression × 0.3) + (RuleBased × 0.3)
```

---

## 🧪 Test Scenarios

### Normal Operation
```bash
node tools/simulatePipes.js
# Expected: ~10-20% probability
```

### Minor Leak
```bash
node tools/simulateLeak.js minor 20 500
# Expected: ~40-50% probability
```

### Major Leak
```bash
node tools/simulateLeak.js major 20 500
# Expected: ~70-80% probability
```

### Pipe Burst
```bash
node tools/simulateLeak.js burst 20 500
# Expected: ~85-95% probability (CRITICAL)
```

---

## 🔧 Configuration

### Change Detection Weights
Edit `utils/dualAIIntegratedEngine.js`:
```javascript
const weights = {
  rule_based: 0.30,        // ← Change this
  lstm_anomaly: 0.40,      // ← Or this
  regression_maintenance: 0.30  // ← Or this
};
```

### Change Alert Thresholds
Edit `utils/dualAIIntegratedEngine.js`:
```javascript
_calculateSeverity(probability) {
  if (probability >= 80) return 'CRITICAL';  // ← Adjust these
  if (probability >= 65) return 'HIGH';
  if (probability >= 50) return 'MEDIUM';
  // ...
}
```

---

## 📁 File Structure

```
models/
  ├── lstm_anomaly_detector.json          (8.20 MB)
  └── regression_maintenance_model.json   (1 KB)

utils/
  ├── dualAIDetector.js                   (Core detection)
  ├── dualAIIntegratedEngine.js           (Integration layer)
  ├── leakDetector.js                     (Rule-based)
  ├── dataPreprocessor.js                 (Features)
  └── mlAnomalyDetector.js                (Legacy - kept for compatibility)

tools/
  ├── trainDualAIModels.js                (Training script)
  └── testDualAI.js                       (Test script)

controllers/
  └── integratedController.js             (API endpoints)

src/
  └── index.js                            (Server startup)
```

---

## 🚨 Troubleshooting

### Models not loading?
```bash
# Retrain them
node tools/trainDualAIModels.js

# Check files exist
ls models/lstm_anomaly_detector.json
ls models/regression_maintenance_model.json
```

### Getting 0% probability?
- Wait 30+ seconds for LSTM buffer to fill
- Check sensor data is realistic (P: 40-60 PSI, F: 15-27 L/min)
- Ensure data preprocessing works: `[PREPROCESSOR] ✓ Features: pressure=X, flow=Y`

### Backend not starting?
```bash
# Check for errors
node src/index.js 2>&1 | grep -i error

# Verify port 3000 is free
netstat -an | grep 3000
```

### High false positives?
- Reduce LSTM weight
- Increase regression weight
- Adjust alert thresholds

---

## 💾 Data Format

### Input Sensor Data
```json
{
  "pressure": 48.5,      // PSI (40-60 normal)
  "flow": 20.5,          // L/min (15-27 normal)
  "temperature": 22,     // Celsius (optional)
  "conductivity": 250,   // µS/cm (optional)
  "wear": 10             // minutes (optional)
}
```

### Output Detection Result
```json
{
  "id": "string",
  "timestamp": "ISO8601",
  "detectionResultSummary": {
    "overallLeakDetected": boolean,
    "overallProbability": 0-100,
    "severityLevel": "CRITICAL|HIGH|MEDIUM|MINOR|NORMAL",
    "confidenceScore": 0-100,
    "detectionMethods": [
      {
        "method": "lstm_anomaly|regression_maintenance|rule_based",
        "probability": 0-100,
        ...
      }
    ],
    "timeToFailure": hours_or_null
  },
  "alert": alert_object_or_null,
  "systemStatus": { ... }
}
```

---

## 📞 Support

### Check System Status
```bash
curl http://localhost:3000/api/detection/status | jq
```

### View Recent Alerts
```bash
curl http://localhost:3000/api/detection/alerts | jq
```

### Training Logs
```bash
# Look in stdout when running
node tools/trainDualAIModels.js 2>&1 | grep LSTM
node tools/trainDualAIModels.js 2>&1 | grep REGRESSION
```

---

**✅ System Status**: Ready to deploy and monitor! 🚀

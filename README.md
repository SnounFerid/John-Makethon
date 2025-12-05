# 💧 Water Leak Detection — Runbook & Quickstart

Welcome! This repo is a real-time water leak detection demo: ingest sensor telemetry, run rule-based checks and a machine learning detector, raise alerts, and control valves from a React dashboard.

This README is a friendly, copy-paste guide that gets the whole system running (backend, frontend, and simulators), and explains training and calibration steps.

---

## Quick Overview
- Backend: Node.js + Express (API, ML glue, SQLite DB)
- Frontend: React app in `frontend/` (dashboard, live updates via WebSocket)
- ML: Custom IsolationForest in `utils/mlAnomalyDetector.js` with training scripts under `backend/scripts`
- Simulators: `tools/simulatePipes.js` (normal stream) and `tools/simulateLeak.js` (single scenario runs)

Run this on Windows PowerShell (instructions include copyable commands).

---

## Prerequisites
- Node.js 16+ installed (https://nodejs.org/)
- Optional: Git, VS Code

Open PowerShell in the project root (where this README lives).

## 1) Install dependencies (one-time)
Run these commands from the repo root:

```powershell
# Install root dependencies
npm install

# Install frontend deps
cd frontend
npm install
cd ..
```

If `npm` scripts fail on PowerShell (execution policy), use `npm.cmd` instead (e.g. `npm.cmd run dev`).

## 2) Environment variables (optional, tuning)
You can tune the ML and hysteresis behavior with environment variables. These are optional — defaults are safe for development.

- `ISO_NUM_TREES` — number of isolation trees (default 500)
- `ISO_SAMPLE_SIZE` — sample size per tree (default 1024)
- `HYSTERESIS_CONSECUTIVE` — N consecutive ML anomalies required to emit an ML-only alert (default 3)
- `PORT` — backend port (default 3000)

Example (PowerShell):

```powershell
$env:ISO_NUM_TREES=500; $env:ISO_SAMPLE_SIZE=1024; $env:HYSTERESIS_CONSECUTIVE=3; $env:PORT=3000
```

## 3) Start the backend
Open a new PowerShell window in the repo root and run either:

Simple (recommended):

```powershell
node src/index.js
```

Development (auto-reload if configured):

```powershell
npm run dev
```

When the server starts you should see:

- API server listening (port printed)
- WebSocket endpoint enabled
- SQLite database connected (`./db/sensor_data.db`)

## 4) Start the frontend dashboard
In a separate PowerShell window:

```powershell
cd frontend
npm start
```

By default the frontend runs on port `3001` (this project pins the dev server to 3001). Open the dashboard at:

http://localhost:3001

The dashboard shows live telemetry and an Alerts panel.

## 5) Simulation — generate live sensor data
There are two simulator scripts in `tools/`:

- `tools/simulatePipes.js` — continuous normal-only stream (use for demo / baseline)
- `tools/simulateLeak.js` — run a focused leak scenario (minor / major / burst)

Examples (run from repo root):

Run normal stream (long-running):

```powershell
node tools/simulatePipes.js
```

Run a short minor leak (10 samples, 200ms interval):

```powershell
node tools/simulateLeak.js minor 10 200
```

Run a major leak for 30 samples at 1s intervals:

```powershell
node tools/simulateLeak.js major 30 1000
```

Run a high-volume pipe burst (stress test):

```powershell
node tools/simulateLeak.js burst 100 200
```

Notes:
- `simulateLeak.js` posts to `http://localhost:3000/api/sensor-data` by default (set `BACKEND_URL` env var to change)
- If you want to trigger alerts reliably, use `major` or `burst` scenarios (these create larger pressure drops and flow spikes)

## 6) Train & calibrate the ML model
Two-step scripts are available to prepare data, train, and calibrate a recommended threshold.

Prepare data (converts dataset CSVs to processed JSON and adds engineered features):

```powershell
node backend/scripts/prepareTrainingData.js
```

Train the model (IsolationForest) and save it to `backend/models/custom_trained_model.json`:

```powershell
node backend/scripts/trainModel.js
```

Optional: calibrate thresholds using processed test data (writes `models/model_config.json`):

```powershell
node tools/calibrateThreshold.js custom_trained_model.json
```

If you prefer an API-driven flow, start the backend and call the training endpoint (example):

```powershell
curl -X POST http://localhost:3000/api/train-model -H "Content-Type: application/json" -d '{ "source": "prepared" }'
```

## 7) How to trigger an alert manually (fast path)
If your frontend or simulator doesn't produce an alert, try these steps to force detection:

1. Start backend and frontend.
2. Use a strong leak scenario:

```powershell
node tools/simulateLeak.js major 30 500
```

3. If still no alert, you can temporarily increase ML weight in `utils/integratedEngine.js` (quick test):

- Open `utils/integratedEngine.js` and find the ML incorporation line; increase ML weight (e.g., from `0.6` to `0.9`) or lower the combined threshold in `_combineDetectionResults` logic.
- Restart the backend and re-run the `major` scenario.

4. For a robust fix, retrain the model using the `prepareTrainingData.js` improvements (class-balancing and engineered features are already applied in the scripts) and run `trainModel.js`.

## 8) Alert lifecycle and UI
- Alerts are exposed at `/api/alerts` with endpoints for active, history, acknowledge and resolve.
- Alerts are currently kept in-memory for fast iteration (you can enable DB persistence later by adding an `alerts` table and persisting from `utils/integratedEngine.js`).

## 9) Troubleshooting & tips
- If the frontend can't connect to WebSocket: ensure backend port and `BACKEND_URL` match, and that port is not blocked by firewall.
- If `npm start` fails in frontend: check that `node` and `npm` are installed and versions are compatible.
- If you see many false positives: try retraining (balanced data) or increase `HYSTERESIS_CONSECUTIVE` to reduce transients.

## 10) Handy helper scripts (optional)
If you'd like, I can add a `run.bat` or `start-dev.ps1` that:
- sets recommended env vars
- starts backend and frontend in separate windows
- launches the normal simulator

Would you like me to add a one-click `run.bat` or a `start-dev.ps1` script? Reply and I'll add it.

---

Thanks for trying this project — tell me which part you'd like automated next (one-click run, persist alerts to DB, tune thresholds, or add CI tests) and I'll implement it.
# 💧 Water Leak Detection System - Complete Guide

> **A Smart System That Detects Water Leaks Before They Become Disasters**

---

## 📖 Table of Contents

1. [What Is This App?](#what-is-this-app)
2. [How It Works (Simple Explanation)](#how-it-works-simple-explanation)
3. [Getting Started (Step-by-Step)](#getting-started-step-by-step)
4. [Starting the Web App](#starting-the-web-app)
5. [Using the Dashboard](#using-the-dashboard)
6. [Training the AI](#training-the-ai)
7. [Understanding the Components](#understanding-the-components)
## Water Leak Detection System

Professional, production-oriented README

Overview
--------
This repository implements a real-time water leak detection platform. It ingests sensor telemetry (pressure, flow, temperature), runs rule-based checks and an ML anomaly detector, raises alerts, provides a React-based operator dashboard, and supports on-demand model training using datasets under `backend/training_data`.

Key capabilities
- Real-time data ingestion and WebSocket streaming
- Rule-based and ML-based leak detection
- Alert lifecycle (create, acknowledge, resolve) with audit logging
- Manual and automatic valve control for emergency isolation
- On-demand model training using prepared datasets (Isolation Forest implementation)

Project layout (important folders)
- `src/` - server entry and integration code (main app)
- `backend/` - backend controllers, services and scripts
- `backend/training_data/` - CSV datasets and processed training output
- `frontend/` - React application (dashboard)
- `db/` - SQLite database and initialization
- `utils/` - ML utilities and anomaly detector

John Makethon — Quick & Easy Guide
=================================

If you want the very short version: this app detects anomalies (possible leaks), shows them in a dashboard, and can automatically (or manually) close valves. Below are simple, copy-paste steps to run everything and to train the AI model — written for Windows PowerShell and for someone who "doesn't know code".

Before you start (one-time)
- Install Node.js (recommended 16 or newer): https://nodejs.org/
- Open PowerShell (press Windows, type "PowerShell", press Enter).

Step A — Install everything (one-time)
1. Open a PowerShell window and run these commands one by one from the project folder root (where this README is):

```powershell
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

Step B — Start the backend (run in a new PowerShell window)
Option 1 — Simple (recommended for now):

```powershell
# Start backend directly
node src/index.js
```

Option 2 — Development (auto-reloads when files change):

```powershell
# Use the dev script (nodemon). If you see an npm.ps1 error, run `npm.cmd run dev` instead.
npm run dev
```

Step C — Start the frontend (run in a different PowerShell window)

```powershell
cd frontend
npm start
```

Step D — Open the dashboard
- In your browser go to: http://localhost:3000  (or the address shown in the frontend terminal)

That should be it — you will see live telemetry and controls.

How to train the AI model (very simple)
-------------------------------------
There are two easy ways: using scripts (recommended for local experiments) or using the backend API.

Method 1 — Run scripts (local files in the repo)
1. Prepare training data from CSV files (this produces a combined JSON file):

```powershell
node backend/scripts/prepareTrainingData.js
```

After that completes, you should find: `backend/training_data/processed/combined_training_data.json`

2. Train the model using that processed file:

```powershell
node backend/scripts/trainModel.js
```

When it finishes, look in `backend/models/` for a file named `custom_trained_model_<timestamp>.json`.

Method 2 — Use the backend API (start the backend first)
1. Start the backend (see Step B).
2. From PowerShell run this command to tell the server to prepare data and train in one step:

```powershell
# Replace 3000 with your backend PORT if different
curl -X POST http://localhost:3000/api/train-model -H "Content-Type: application/json" -d "{ \"source\": \"prepared\" }"
```

3. The API will respond with a short message and the trained model will be saved under `backend/models/`.

Checking training progress and results
- After script mode: check the `backend/models/` folder for new file(s).
- After API mode: the HTTP response includes basic info; for more details see backend logs in the terminal running the backend.

Troubleshooting (common issues)
-------------------------------
- If PowerShell blocks npm scripts with `npm.ps1` errors: use `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`), or run `node src/index.js` directly.
- If you get "port already in use" when starting the backend: stop the process using that port or run on another port:

```powershell
# Temporarily set PORT to 4000 for this session and start
$env:PORT=4000
npm run dev
```

- If a control action (like "Close Valve") returns HTTP 400: open the browser DevTools → Network tab, click the failing request, copy the Request URL and Request Body, and paste them here — I will check the backend controller and fix it.

Quick checklist for a successful run
----------------------------------
- [ ] Node.js installed
- [ ] `npm install` ran in both root and `frontend/`
- [ ] Backend running (`node src/index.js` or `npm run dev`)
- [ ] Frontend running (`cd frontend; npm start`)
- [ ] Dashboard open at `http://localhost:3000`

If you want more help
--------------------
- I can add a ready-to-use VS Code debug configuration (`/.vscode/launch.json`).
- If the valve control still returns `400`, paste the failing request (URL + body) and the backend terminal logs, and I'll fix it.

Would you like me to also add a simple `run.bat` that starts both backend and frontend for you with one click? I can add that next.


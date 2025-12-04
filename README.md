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


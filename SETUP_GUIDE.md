# Setup Guide for John Makathon Project

## Option 1: Node.js Dependencies Only (Recommended for Frontend/Backend)

### Windows PowerShell

```powershell
# Navigate to project root
cd "c:\Users\Snoun Ferid\Desktop\misc\HACKATHONS\makethon insat\John-Makethon"

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies  
cd frontend
npm install
cd ..
```

### macOS/Linux Bash

```bash
# Navigate to project root
cd ~/Desktop/misc/HACKATHONS/makethon\ insat/John-Makethon

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Option 2: Python Virtual Environment (If using Python components)

### Windows PowerShell

```powershell
# Navigate to project root
cd "c:\Users\Snoun Ferid\Desktop\misc\HACKATHONS\makethon insat\John-Makethon"

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate again:
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install Python dependencies (if any)
pip install -r requirements.txt
```

### macOS/Linux Bash

```bash
# Navigate to project root
cd ~/Desktop/misc/HACKATHONS/makethon\ insat/John-Makethon

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install Python dependencies (if any)
pip install -r requirements.txt
```

---

## Option 3: Complete Setup (Node.js + Python venv)

### Windows PowerShell

```powershell
# Navigate to project root
$projectPath = "c:\Users\Snoun Ferid\Desktop\misc\HACKATHONS\makethon insat\John-Makethon"
cd $projectPath

# Create Python virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
.\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

# Install npm dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
cd backend
npm install
cd ..

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
cd frontend
npm install
cd ..

Write-Host "Setup complete!" -ForegroundColor Green
```

### macOS/Linux Bash

```bash
#!/bin/bash

projectPath="~/Desktop/misc/HACKATHONS/makethon insat/John-Makethon"
cd "$projectPath"

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete!"
```

---

## Verifying Installation

### Check Node.js/npm Installation

```powershell
# Windows PowerShell
npm --version
node --version
```

### Check Python Virtual Environment

```powershell
# Windows PowerShell
python --version
pip --version
```

### List Installed Dependencies

```powershell
# Node.js packages
npm list

# Python packages (if venv is activated)
pip list
```

---

## Using the Project

### Running Backend Server

```powershell
cd backend
npm start
```

### Running Frontend

```powershell
cd frontend
npm start
```

### Running Tests

```powershell
# All tests
npm test

# Backend tests only
npm test --prefix backend

# Frontend tests only
npm test --prefix frontend
```

### Running with Python venv Active

```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Then run npm commands
npm start
npm test
```

---

## Deactivating Virtual Environment

When you're done working:

```powershell
# Windows PowerShell
deactivate

# macOS/Linux
deactivate
```

---

## Troubleshooting

### "venv activation script is not signed" (Windows)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "npm command not found"

- Install Node.js from https://nodejs.org/
- Restart your terminal
- Verify with `npm --version`

### "python command not found"

- Install Python from https://www.python.org/
- Make sure to check "Add Python to PATH" during installation
- Restart your terminal
- Verify with `python --version`

### Port already in use

```powershell
# Kill process on port 3000 (Windows)
Get-Process | Where-Object {$_.Port -eq 3000} | Stop-Process

# Or specify different port
$env:PORT=3001
npm start
```

---

## Next Steps

1. **Create virtual environment** (if using Python components)
2. **Install dependencies** (npm install)
3. **Start development**:
   - Backend: `npm start --prefix backend`
   - Frontend: `npm start --prefix frontend`
4. **Run tests**: `npm test`
5. **Check documentation**: See README.md and QUICKSTART.md

---

## Quick Reference

| Task | Command |
|------|---------|
| Activate venv (Windows) | `.\venv\Scripts\Activate.ps1` |
| Activate venv (Mac/Linux) | `source venv/bin/activate` |
| Deactivate venv | `deactivate` |
| Install npm deps | `npm install` |
| Start backend | `npm start --prefix backend` |
| Start frontend | `npm start --prefix frontend` |
| Run tests | `npm test` |
| View coverage | `npm test -- --coverage` |

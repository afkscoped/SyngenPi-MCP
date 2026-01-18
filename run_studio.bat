@echo off
echo ==========================================
echo    Syngen-Pi MCP Studio - Setup ^& Run
echo ==========================================

echo.
echo [1/5] Checking Environment...
python check_env.py
if %errorlevel% neq 0 (
    echo Environment check failed. Exiting...
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Installing Backend Dependencies...
cd backend
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install backend requirements.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [3/5] Checking/Installing Frontend Dependencies...
cd frontend
if not exist node_modules (
    call npm install
) else (
    echo node_modules exists, skipping npm install. Run manually if needed.
)
cd ..

echo.
echo [4/5] Starting Backend (Port 8000)...
start "MCP Backend" cmd /k "python -m uvicorn backend.main:app --reload --port 8000"

echo.
echo [5/5] Starting Frontend (Port 3000)...
start "MCP Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo    SYSTEM LAUNCHED 🚀
echo ==========================================
echo Backend API Docs: http://localhost:8000/docs
echo Frontend App:     http://localhost:3000
echo.
echo PLEASE ENSURE 'backend/.env' IS CONFIGURED!
echo.
pause

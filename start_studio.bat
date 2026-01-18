@echo off
echo ===================================================
echo   SYNGEN PI MCP STUDIO - FULL SYSTEM STARTUP
echo ===================================================
echo.

:: 1. Backend Startup
echo [1/2] Launching Backend Server...
start "MCP Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: 2. Frontend Startup
echo [2/2] Launching Frontend Interface...
echo Waiting for backend to warm up...
timeout /t 3 >nul
start "MCP Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   SYSTEM RUNNING
echo ===================================================
echo   Backend: http://localhost:8000/docs
echo   Frontend: http://localhost:3000
echo.
echo   (Close the popup windows to stop the servers)
echo ===================================================
pause

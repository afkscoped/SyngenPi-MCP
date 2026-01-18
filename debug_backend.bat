@echo off
echo Starting Backend in Debug Mode...
python -m uvicorn backend.main:app --reload --port 8000
echo.
echo ==============================================
echo Backend crashed or stopped.
echo See error message above.
echo ==============================================
pause

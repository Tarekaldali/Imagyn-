@echo off
echo ========================================
echo   ComfyUI Image Generator - Full Stack
echo ========================================
echo.

cd /d "%~dp0"

REM Check for Python environment
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please create it first: python -m venv .venv
    pause
    exit /b 1
)

REM Start Backend API Server (Port 8000) - MOST IMPORTANT!
echo [1/3] Starting Backend API Server (Port 8000)...
if exist "ai_platform\backend\venv\Scripts\python.exe" (
    start "Backend API Server (DO NOT CLOSE)" cmd /k "cd /d %~dp0ai_platform\backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
) else (
    echo ERROR: Backend virtual environment not found!
    echo Please install backend dependencies first.
    pause
    exit /b 1
)
timeout /t 5 /nobreak >nul

REM Start ComfyUI Backend (Port 8189)
echo [2/3] Starting ComfyUI Backend (Port 8189)...
start "ComfyUI Backend (DO NOT CLOSE)" cmd /k "%~dp0.venv\Scripts\python.exe %~dp0main.py --port 8189"
timeout /t 5 /nobreak >nul

REM Start Flask Web Wrapper (Port 8890)
echo [3/3] Starting Flask Web Wrapper (Port 8890)...
start "Flask Web Server (DO NOT CLOSE)" cmd /k "cd /d %~dp0web_wrapper && ..\.venv\Scripts\python.exe flask_server.py"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   ✅ All Services Started!
echo ========================================
echo.
echo IMPORTANT: Do NOT close the 3 terminal windows!
echo.
echo Backend API:         http://localhost:8000
echo Backend API Docs:    http://localhost:8000/docs
echo ComfyUI Backend:     http://localhost:8189
echo Web Interface:       http://localhost:8890
echo Login Page:          http://localhost:8890/login.html
echo.
echo Press any key to open the web interface...
pause >nul

start http://localhost:8890/login.html

echo.
echo ========================================
echo All services are running in separate windows.
echo DO NOT CLOSE those windows!
echo Close this window only.
echo ========================================
echo.
pause

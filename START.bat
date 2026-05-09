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
start "ComfyUI Backend (DO NOT CLOSE)" cmd /k "python %~dp0main.py --port 8189"
timeout /t 5 /nobreak >nul

REM Start Frontend (React Vite) instead of Flask Web Wrapper
echo [3/3] Starting React Frontend (Vite)
for /f %%P in ('powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort 8890 -State Listen -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique) -join \" \" "') do (
    echo Found existing process on port 8890 (PID: %%P). Stopping it...
    taskkill /PID %%P /F >nul 2>&1
)
if exist "%~dp0web_wrapper\frontend-react\package.json" (
    start "React Frontend (DO NOT CLOSE)" cmd /k "cd /d %~dp0web_wrapper\frontend-react && npm run dev"
) else (
    echo React frontend not found at web_wrapper\frontend-react; skipping frontend start.
)
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
echo Web App:             http://localhost:8890
echo.
echo Press any key to open the web interface...
pause >nul

start http://localhost:8890

echo.
echo ========================================
echo All services are running in separate windows.
echo DO NOT CLOSE those windows!
echo Close this window only.
echo ========================================
echo.
pause

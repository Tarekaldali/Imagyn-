@echo off
setlocal

echo ========================================
echo   ComfyUI Image Generator - Full Stack
echo ========================================
echo.

cd /d "%~dp0"

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%ai_platform\backend"
set "FRONTEND_DIR=%ROOT_DIR%web_wrapper\frontend-react"
set "COMFY_PYTHON=%LocalAppData%\Programs\Python\Python313\python.exe"

if not exist "%ROOT_DIR%.venv\Scripts\python.exe" (
    echo ERROR: Root virtual environment not found.
    echo Expected: %ROOT_DIR%.venv\Scripts\python.exe
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    echo ERROR: Backend virtual environment not found.
    echo Expected: %BACKEND_DIR%\venv\Scripts\python.exe
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo ERROR: Frontend project not found.
    echo Expected: %FRONTEND_DIR%\package.json
    pause
    exit /b 1
)

if not exist "%COMFY_PYTHON%" (
    echo ERROR: CUDA-enabled global Python not found at:
    echo %COMFY_PYTHON%
    echo.
    echo This launcher is configured to avoid the CPU-only .venv torch build.
    pause
    exit /b 1
)

echo [0/3] Cleaning frontend port 8890 if needed...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-NetTCPConnection -LocalPort 8890 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { Stop-Process -Id $p -Force }" >nul 2>&1

echo [1/3] Starting Backend API Server (Port 8000)...
start "Backend API Server (DO NOT CLOSE)" cmd /k "cd /d ""%BACKEND_DIR%"" && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 5 /nobreak >nul

echo [2/3] Starting ComfyUI Backend (Port 8189) with CUDA Python...
start "ComfyUI Backend (DO NOT CLOSE)" cmd /k "cd /d ""%ROOT_DIR%"" && ""%COMFY_PYTHON%"" main.py --port 8189 --disable-api-nodes"
timeout /t 5 /nobreak >nul

echo [3/3] Starting React Frontend (Vite)...
start "React Frontend (DO NOT CLOSE)" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   All Services Started
echo ========================================
echo.
echo Backend API:         http://localhost:8000
echo Backend API Docs:    http://localhost:8000/docs
echo ComfyUI Backend:     http://localhost:8189
echo Web App:             http://localhost:8890
echo.
echo Press any key to open the web app...
pause >nul

start http://localhost:8890

echo.
echo Keep the service windows open while using the app.
pause

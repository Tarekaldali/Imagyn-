@echo off
echo ========================================
echo   BACKEND SERVER STARTER
echo   (Fixes "Failed to fetch" error)
echo ========================================
echo.

cd /d "%~dp0"

REM Navigate to backend folder
cd ai_platform\backend

REM Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Backend virtual environment not found!
    echo.
    echo Creating virtual environment...
    python -m venv venv
    
    echo Installing dependencies...
    venv\Scripts\pip.exe install -r requirements.txt
)

echo.
echo Starting Backend API Server on port 8000...
echo.
echo ========================================
echo   Backend API Running!
echo ========================================
echo.
echo   URL: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Health Check: http://localhost:8000/health
echo.
echo   DO NOT CLOSE THIS WINDOW!
echo ========================================
echo.

REM Start the server
venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause

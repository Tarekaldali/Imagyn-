@echo off
REM Quick setup for async image generation

echo ============================================
echo   ASYNC IMAGE GENERATION - SETUP
echo ============================================
echo.

echo Step 1: Database Migration
echo ---------------------------
echo Please run this SQL in your Supabase SQL Editor:
echo.
type ADD_IMAGE_URL_TO_JOBS.sql
echo.
echo.
pause

echo.
echo Step 2: Restart Backend
echo -----------------------
echo Starting backend API on port 8000...
echo.

cd ai_platform\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause

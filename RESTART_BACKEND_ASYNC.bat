@echo off
REM ==============================================
REM   RESTART BACKEND WITH ASYNC GENERATION
REM ==============================================

echo.
echo ============================================
echo   STEP 1: Database Migration
echo ============================================
echo.
echo You MUST run the SQL migration first!
echo.
echo 1. Open: https://app.supabase.com
echo 2. Go to SQL Editor
echo 3. Copy contents of: RUN_THIS_IN_SUPABASE_NOW.sql
echo 4. Click Run
echo.
echo Press any key when you have run the SQL migration...
pause
echo.

echo.
echo ============================================
echo   STEP 2: Starting Backend with Async Code
echo ============================================
echo.
echo Starting backend on http://localhost:8000
echo.
echo When it starts, watch for these messages:
echo   ✅ "Background task: Image uploaded to R2 successfully"
echo   ✅ "Background task: Job completed successfully with image_url"
echo.
echo Press Ctrl+C to stop the backend
echo.

cd ai_platform\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

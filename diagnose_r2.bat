@echo off
echo ============================================
echo   R2 IMAGE STORAGE - DIAGNOSTIC TOOL
echo ============================================
echo.

echo Step 1: Testing R2 Configuration
echo ---------------------------------
echo.
python test_r2_config.py
echo.
echo.

echo Step 2: Instructions
echo --------------------
echo.
echo If R2 test PASSED:
echo   - R2 upload is working correctly
echo   - Problem is likely the database migration
echo   - GO TO: https://app.supabase.com/project/YOUR_PROJECT/sql/new
echo   - COPY contents of ADD_IMAGE_URL_TO_JOBS.sql
echo   - CLICK Run button
echo.
echo If R2 test FAILED:
echo   - Check ai_platform/backend/.env file
echo   - Verify R2 credentials are correct:
echo     * R2_ACCOUNT_ID
echo     * R2_ACCESS_KEY_ID
echo     * R2_SECRET_ACCESS_KEY
echo     * R2_BUCKET_NAME
echo     * R2_PUBLIC_URL
echo.
echo.

echo Next Steps:
echo -----------
echo 1. Fix any issues above
echo 2. Restart backend: 
echo    cd ai_platform/backend
echo    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo 3. Try generating an image
echo 4. Check backend logs for "Image uploaded to R2 successfully"
echo.

pause

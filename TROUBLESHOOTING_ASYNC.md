# Diagnostic Script for Async Generation Issues
# Run this to check if everything is configured correctly

## Issue: Images not storing in Cloudflare R2 and not displaying when finished

### Checklist:

1. **Database Migration - Did you run the SQL?**
   ```sql
   ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_url TEXT;
   CREATE INDEX IF NOT EXISTS idx_jobs_image_url ON jobs(image_url) WHERE image_url IS NOT NULL;
   ```
   
   ✅ Run this in Supabase SQL Editor first!
   
   Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new
   Paste the SQL from `ADD_IMAGE_URL_TO_JOBS.sql`
   Click "Run"

2. **Check Backend Logs**
   
   When you generate an image, look for these log messages:
   
   ```
   ✅ GOOD:
   - "Background task: Starting generation for job {job_id}"
   - "Background task: Generation successful for job {job_id}, uploading to R2"
   - "Background task: Image uploaded to R2 successfully: https://..."
   - "Background task: Job {job_id} completed successfully with image_url: https://..."
   
   ❌ BAD:
   - "Background task: Failed to upload image for job {job_id} - R2 service returned None/empty"
   - "Background task: Failed to create image record for job {job_id}"
   - "Background task: Unexpected error for job {job_id}: ..."
   ```

3. **Check R2 Configuration**
   
   Verify your `.env` file has:
   ```
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=your_bucket_name
   R2_PUBLIC_URL=https://your-bucket.r2.dev
   ```

4. **Check Frontend Console**
   
   Open browser DevTools (F12) and look for:
   
   ```javascript
   ✅ GOOD:
   - "📊 Job {job_id} status: completed"
   - "✅ Job completed! Image URL: https://..."
   
   ❌ BAD:
   - "Failed to fetch job status: 404"
   - Job stays in "processing" forever
   - No image_url in response
   ```

5. **Manual Database Check**
   
   Run this SQL in Supabase to see recent jobs:
   ```sql
   SELECT 
     id, 
     status, 
     image_url, 
     created_at, 
     finished_at,
     error_message
   FROM jobs 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
   
   Check if:
   - Status is "completed"
   - image_url is NOT NULL
   - image_url starts with "https://"

### Common Issues & Solutions:

**Issue 1: "column 'image_url' does not exist"**
- Solution: Run the migration SQL in Supabase
- File: `ADD_IMAGE_URL_TO_JOBS.sql`

**Issue 2: R2 upload returns None/empty**
- Check R2 credentials in `.env`
- Check R2 service logs
- Verify bucket exists and is accessible
- Check if R2_PUBLIC_URL is set correctly

**Issue 3: Job stays "processing" forever**
- Check backend logs for errors
- Check if ComfyUI is running on port 8890
- Restart backend

**Issue 4: Image URL in database but not displaying**
- Check browser console for CORS errors
- Verify R2_PUBLIC_URL is correct
- Check if image URL is accessible (open in new tab)

**Issue 5: Frontend not polling or showing image**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check console for JavaScript errors

### Quick Test:

1. Generate an image
2. Watch backend logs in real-time
3. Check if you see "Image uploaded to R2 successfully"
4. Check if you see "Job completed successfully with image_url"
5. If yes, problem is in frontend polling
6. If no, problem is in R2 upload or database

### Restart Everything:

```bash
# Stop everything
# Then restart:

# Terminal 1: Backend
cd ai_platform/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: ComfyUI (if not already running)
cd ../../
python main.py --listen 0.0.0.0 --port 8890

# Terminal 3: Frontend (if using web wrapper)
cd web_wrapper
# Open frontend/index.html in browser
```

### Check if Migration Was Applied:

Run this SQL in Supabase:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'image_url';
```

If it returns 0 rows, the migration was NOT applied!

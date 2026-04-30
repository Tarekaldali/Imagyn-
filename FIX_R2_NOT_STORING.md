# 🔧 FIX: Images Not Storing in Cloudflare R2 and Not Displaying

## MOST LIKELY CAUSE: Database Migration Not Applied

### ⚡ QUICK FIX (Do This First!)

**Step 1: Run the Database Migration**

Go to your Supabase Dashboard:
1. Open: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
2. Copy and paste this SQL:

```sql
-- Add image_url column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_image_url ON jobs(image_url) WHERE image_url IS NOT NULL;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'image_url';
```

3. Click "Run" button
4. You should see a result showing the image_url column

**Step 2: Restart Your Backend**

```powershell
# Stop backend (Ctrl+C if running)
# Then restart:
cd ai_platform/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Step 3: Test**

1. Generate an image
2. Watch backend console for these messages:
   - "Background task: Image uploaded to R2 successfully: https://..."
   - "Background task: Job completed successfully with image_url: https://..."
3. Image should appear in frontend when complete

---

## 🔍 DIAGNOSIS STEPS

### Check 1: Verify Database Migration

Run in Supabase SQL Editor:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'image_url';
```

**Expected:** 1 row returned with "image_url"
**If empty:** Migration not applied - go back to Step 1 above!

### Check 2: Test R2 Upload

Run this command:
```powershell
python test_r2_config.py
```

**Expected:** "✅ R2 IS WORKING CORRECTLY"
**If failed:** Check R2 credentials in `.env` file

### Check 3: Check Recent Jobs

Run in Supabase SQL Editor:
```sql
SELECT 
  id,
  status,
  image_url,
  error_message,
  created_at,
  finished_at
FROM jobs 
ORDER BY created_at DESC 
LIMIT 5;
```

**What to look for:**
- ✅ Status = "completed"
- ✅ image_url is NOT NULL (should be a https:// URL)
- ❌ Status = "failed" → Check error_message
- ❌ image_url is NULL → R2 upload failed or migration not applied

### Check 4: Backend Logs

Generate an image and watch backend logs for:

**Good Signs:**
```
Background task: Starting generation for job 123...
Background task: Generation successful for job 123, uploading to R2
Background task: Image path: /path/to/image.png
Background task: File exists: True
Background task: Image uploaded to R2 successfully: https://...
Background task: Job 123 completed successfully with image_url: https://...
```

**Bad Signs:**
```
Background task: Failed to upload image for job 123 - R2 service returned None/empty
Background task: Unexpected error for job 123: ...
KeyError: 'image_url'  ← Means migration not applied!
```

### Check 5: Frontend Polling

Open browser DevTools (F12) → Console tab

**Good Signs:**
```javascript
📊 Job 123 status: processing
📊 Job 123 status: completed
✅ Job completed! Image URL: https://...
```

**Bad Signs:**
```javascript
Failed to fetch job status: 404
Job status undefined or null
Image URL missing in response
```

---

## 🛠️ SOLUTIONS BY SYMPTOM

### Symptom: "column 'image_url' does not exist"

**Cause:** Database migration not applied
**Fix:** Run the SQL migration (see Step 1 above)

### Symptom: Job completes but image_url is NULL

**Cause:** R2 upload failed
**Fix:**
1. Check R2 credentials in `ai_platform/backend/.env`:
   ```
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=your_bucket_name
   R2_PUBLIC_URL=https://your-bucket.r2.dev
   ```
2. Run `python test_r2_config.py` to verify
3. Check Cloudflare R2 dashboard - is bucket accessible?

### Symptom: Job status stays "processing" forever

**Cause:** Background task crashed or stuck
**Fix:**
1. Check backend logs for errors
2. Verify ComfyUI is running: http://localhost:8890
3. Restart backend

### Symptom: Image URL exists but doesn't display in browser

**Cause:** CORS or R2_PUBLIC_URL misconfigured
**Fix:**
1. Copy image URL from database
2. Try opening in browser directly
3. If 404 → R2_PUBLIC_URL is wrong
4. If CORS error → Configure CORS in Cloudflare R2 dashboard

### Symptom: Frontend never updates to "completed"

**Cause:** Polling not working or job_id mismatch
**Fix:**
1. Check browser console for errors
2. Hard refresh (Ctrl+Shift+F5)
3. Clear browser cache
4. Verify job_id matches between frontend and backend

---

## 📝 COMPLETE RESTART PROCEDURE

If nothing works, do a complete restart:

```powershell
# 1. Stop everything (Ctrl+C on all terminals)

# 2. Run database migration in Supabase (SQL above)

# 3. Test R2
python test_r2_config.py

# 4. Restart ComfyUI
python main.py --listen 0.0.0.0 --port 8890

# 5. In new terminal: Restart backend
cd ai_platform/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. Open frontend in browser (hard refresh!)
# Navigate to: http://localhost:8000/static/index.html
# Or open: web_wrapper/frontend/index.html
```

---

## 🎯 VERIFICATION CHECKLIST

After fixing, verify these all work:

- [ ] Database has `image_url` column in `jobs` table
- [ ] R2 test script passes
- [ ] Backend starts without errors
- [ ] ComfyUI accessible at http://localhost:8890
- [ ] Can login to frontend
- [ ] Click "Generate" → UI stays responsive
- [ ] Can click "Generate" multiple times (queue)
- [ ] Gallery shows image as "pending"
- [ ] Gallery updates to "processing"
- [ ] Image appears in gallery when complete
- [ ] Image URL in database (check SQL)
- [ ] Image accessible via URL in browser

---

## 📞 STILL NOT WORKING?

Share these details:

1. **Database Check Result:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'jobs' AND column_name = 'image_url';
   ```
   Result: ___________

2. **R2 Test Result:**
   ```powershell
   python test_r2_config.py
   ```
   Output: ___________

3. **Recent Job Status:**
   ```sql
   SELECT status, image_url, error_message FROM jobs ORDER BY created_at DESC LIMIT 1;
   ```
   Result: ___________

4. **Backend Logs:** (copy last 20 lines after generating)

5. **Frontend Console Errors:** (copy any red errors from F12 console)

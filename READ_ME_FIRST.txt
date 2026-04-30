=============================================================================
  🚨 IMAGES NOT DISPLAYING - 3 STEP FIX 🚨
=============================================================================

STEP 1: RUN SQL IN SUPABASE (REQUIRED!)
----------------------------------------
1. Go to: https://app.supabase.com → Your Project → SQL Editor
2. Copy ALL contents of: RUN_THIS_IN_SUPABASE_NOW.sql
3. Paste and click "Run"
4. Should see: "✅ SUCCESS: image_url column exists"

STEP 2: RESTART BACKEND
-----------------------
Stop current backend (Ctrl+C) then run:
  cd ai_platform\backend
  python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

STEP 3: TEST
------------
1. Generate an image
2. Watch backend console for: "Image uploaded to R2 successfully"
3. Image should appear in frontend!

=============================================================================

WHY THIS IS NEEDED:
-------------------
The async generation code stores image URLs in the "jobs" table, but that
column doesn't exist yet. Running the SQL migration adds it.

VERIFICATION:
-------------
After Step 1, run this SQL to verify:
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'jobs' AND column_name = 'image_url';

Should return 1 row. If empty = migration failed!

DETAILED INSTRUCTIONS:
----------------------
See: URGENT_FIX_IMAGES.md (complete troubleshooting guide)

=============================================================================

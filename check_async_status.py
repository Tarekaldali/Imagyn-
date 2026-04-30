"""
Simple diagnostic to check if async generation is working
"""

import requests
import json
import time

BACKEND_URL = "http://localhost:8000"

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_recent_jobs(token):
    """Check recent jobs in database via API"""
    try:
        # This would need a user endpoint, for now just return info
        print("To check jobs manually:")
        print("1. Go to Supabase SQL Editor")
        print("2. Run: SELECT id, status, image_url, error_message FROM jobs ORDER BY created_at DESC LIMIT 3;")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("=" * 70)
    print("  ASYNC IMAGE GENERATION - DIAGNOSTIC")
    print("=" * 70)
    print()
    
    # Check 1: Backend running
    print("1. Checking if backend is running...")
    if check_backend():
        print("   ✅ Backend is running on port 8000")
    else:
        print("   ❌ Backend is NOT running!")
        print("   Start it with:")
        print("   cd ai_platform/backend")
        print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    print()
    
    # Check 2: Database migration
    print("2. Database Migration Check")
    print("   ⚠️  CRITICAL: You must run this SQL in Supabase:")
    print()
    print("   ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_url TEXT;")
    print("   CREATE INDEX IF NOT EXISTS idx_jobs_image_url ON jobs(image_url);")
    print()
    print("   Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new")
    print("   Paste the SQL above and click 'Run'")
    print()
    
    # Check 3: Check jobs
    print("3. Recent Jobs Check")
    print("   Run this SQL in Supabase to see recent jobs:")
    print()
    print("   SELECT id, status, image_url, created_at, error_message")
    print("   FROM jobs ORDER BY created_at DESC LIMIT 5;")
    print()
    print("   What to look for:")
    print("   ✅ Status = 'completed' AND image_url is NOT NULL")
    print("   ❌ Status = 'failed' → Check error_message")
    print("   ❌ image_url is NULL → R2 upload failed or migration not run")
    print()
    
    # Check 4: Backend logs
    print("4. Backend Logs Check")
    print("   When you generate an image, watch backend console for:")
    print()
    print("   ✅ GOOD:")
    print("      'Background task: Starting generation for job...'")
    print("      'Background task: Image uploaded to R2 successfully: https://...'")
    print("      'Background task: Job completed successfully with image_url: https://...'")
    print()
    print("   ❌ BAD:")
    print("      'Failed to upload image'")
    print("      'KeyError: image_url' → Migration not applied!")
    print("      Any exception/traceback")
    print()
    
    # Check 5: R2 Config
    print("5. R2 Configuration Check")
    print("   Verify in ai_platform/backend/.env:")
    print()
    print("   R2_ACCOUNT_ID=your_account_id")
    print("   R2_ACCESS_KEY_ID=your_access_key")
    print("   R2_SECRET_ACCESS_KEY=your_secret_key")
    print("   R2_BUCKET_NAME=your_bucket_name")
    print("   R2_PUBLIC_URL=https://your-bucket.r2.dev")
    print()
    
    print("=" * 70)
    print("NEXT STEPS:")
    print("=" * 70)
    print()
    print("1. ⚠️  RUN DATABASE MIGRATION (if not done yet)")
    print("2. ✅ Restart backend")
    print("3. 🎨 Generate an image")
    print("4. 👀 Watch backend logs")
    print("5. 🔍 Check job in database (SQL above)")
    print("6. 📱 Check if image_url exists and is accessible")
    print()

if __name__ == "__main__":
    main()

-- ============================================
-- CRITICAL: RUN THIS IN SUPABASE NOW!
-- ============================================
-- This fixes the "image not displaying" issue
-- 
-- Steps:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Go to SQL Editor (left sidebar)
-- 4. Click "New Query"
-- 5. Copy this ENTIRE file and paste it
-- 6. Click "Run" button (or press Ctrl+Enter)
-- ============================================

-- Add image_url column to jobs table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE jobs ADD COLUMN image_url TEXT;
        RAISE NOTICE '✅ Added image_url column to jobs table';
    ELSE
        RAISE NOTICE '✅ image_url column already exists';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_image_url ON jobs(image_url) WHERE image_url IS NOT NULL;

-- Verify the column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS: image_url column exists in jobs table'
        ELSE '❌ FAILED: image_url column NOT found'
    END as status
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'image_url';

-- Show recent jobs to check status
SELECT 
    '📊 Recent Jobs:' as info,
    COUNT(*) as total_jobs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
    SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as with_image_url
FROM jobs;

-- Show last 3 jobs details
SELECT 
    id,
    status,
    CASE 
        WHEN image_url IS NOT NULL THEN '✅ Has URL'
        ELSE '❌ NULL'
    END as image_url_status,
    SUBSTRING(image_url, 1, 50) as image_url_preview,
    error_message,
    created_at
FROM jobs 
ORDER BY created_at DESC 
LIMIT 3;

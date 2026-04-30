-- Add image_url column to jobs table for async generation
-- This allows frontend to get the image URL directly from job status without querying images table

-- Add image_url column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_image_url ON jobs(image_url) WHERE image_url IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'image_url';

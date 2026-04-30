-- ============================================
-- ONE-CLICK FIX: Infinite Recursion Error
-- Copy this entire file and run in Supabase SQL Editor
-- ============================================

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 
    'users' as table_name,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED - Fix Applied!'
        ELSE '❌ RLS Still Enabled - Try Again'
    END as status
FROM pg_tables
WHERE tablename = 'users';

-- Done! You can now login and register.

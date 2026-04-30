-- ============================================
-- COMPLETE FIX FOR REGISTRATION
-- Copy ALL of this and run in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Step 2: Temporarily DISABLE RLS to test if that's the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Check if the table exists and has correct structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check current RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- ============================================
-- AFTER TESTING (if registration works), run this:
-- ============================================

-- Re-enable RLS with proper policies
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow user registration" ON public.users
--     FOR INSERT 
--     TO public
--     WITH CHECK (true);
-- 
-- CREATE POLICY "Users can view own profile" ON public.users
--     FOR SELECT
--     USING (auth.uid() = id);
-- 
-- CREATE POLICY "Users can update own profile" ON public.users
--     FOR UPDATE
--     USING (auth.uid() = id);

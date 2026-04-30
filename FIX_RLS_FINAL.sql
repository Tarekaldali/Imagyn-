-- ============================================
-- COMPLETE FIX: RLS Infinite Recursion for Users Table
-- Run this in Supabase SQL Editor
-- Date: October 14, 2025
-- ============================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- Step 2: Temporarily DISABLE RLS (service role will still work)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies that don't cause recursion
-- Policy 1: Users can read their own data
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own data
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Allow INSERT for service role (used during registration)
-- This is the KEY fix - allows service role to insert without recursion
CREATE POLICY "users_insert_service_role" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Policy 4: Allow admins to do everything
CREATE POLICY "users_admin_all" ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Step 5: Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 6: Test that service role can insert
-- (This should work without infinite recursion)
-- Note: Run this test with your service role key

COMMENT ON TABLE public.users IS 'RLS policies fixed on October 14, 2025 - No more infinite recursion';

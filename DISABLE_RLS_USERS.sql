-- ============================================
-- ALTERNATIVE FIX: Disable RLS on Users Table Completely
-- This is the simplest solution - service role bypasses RLS anyway
-- Run this in Supabase SQL Editor if the other fix doesn't work
-- ============================================

-- Drop all policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_service_role" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- Disable RLS completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Important: With RLS disabled, your service role (backend API) can access everything
-- Security is now handled at the API level (which is fine for your architecture)

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Should show: rls_enabled = false

COMMENT ON TABLE public.users IS 'RLS disabled - security handled by backend API service role';

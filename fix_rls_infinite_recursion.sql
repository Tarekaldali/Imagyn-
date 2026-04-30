-- ============================================
-- FIX: Infinite Recursion in RLS Policy
-- Run this in Supabase SQL Editor
-- ============================================

-- First, DROP the existing broken policy
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Create a NEW policy that works correctly
-- This allows INSERT for authenticated AND anonymous users
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT 
    TO authenticated, anon
    WITH CHECK (true);

-- Alternative: If you want stricter control, use this instead:
-- CREATE POLICY "Allow user registration" ON public.users
--     FOR INSERT 
--     TO authenticated
--     WITH CHECK (auth.uid() = id);

-- Verify the policy was created
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

-- ============================================
-- FIX REGISTRATION ISSUE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add INSERT policy to allow new user registration
-- This allows users to insert their own record when they sign up
CREATE POLICY "Allow user registration" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

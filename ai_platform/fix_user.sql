-- ============================================
-- FIX: Sync auth.users to public.users
-- ============================================

-- This will copy your authenticated user from auth.users to public.users
-- so the backend can find it

-- Step 1: Check if user exists in auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'test@example.com';

-- Step 2: Sync to public.users with credits
INSERT INTO public.users (id, email, name, credits, role)
SELECT 
    au.id,
    au.email,
    'Test User',
    1000,
    'user'
FROM auth.users au
WHERE au.email = 'test@example.com'
ON CONFLICT (id) 
DO UPDATE SET 
    credits = 1000,
    email = EXCLUDED.email;

-- Step 3: Verify the user is now in public.users
SELECT 
    id,
    email,
    name,
    credits,
    role,
    created_at
FROM public.users
WHERE email = 'test@example.com';

-- ============================================
-- SUCCESS! Your user should now have:
-- - Email: test@example.com
-- - Credits: 1000
-- - Role: user
-- ============================================

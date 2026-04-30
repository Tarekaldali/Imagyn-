-- ============================================
-- DEBUG: Check User in Both Tables
-- ============================================

-- Check 1: What's in auth.users?
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'test@example.com';

-- Check 2: What's in public.users?
SELECT 
    id,
    email,
    name,
    credits,
    role,
    plan_id,
    created_at
FROM public.users
WHERE email = 'test@example.com';

-- Check 3: Do the IDs match?
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    pu.id as public_id,
    pu.email as public_email,
    pu.credits,
    pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'test@example.com';

-- Check 4: Are there any users in public.users?
SELECT COUNT(*) as total_users FROM public.users;

-- Check 5: Show all users in public.users
SELECT 
    id,
    email,
    name,
    credits,
    role
FROM public.users
LIMIT 10;

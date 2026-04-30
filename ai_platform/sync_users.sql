-- ============================================
-- SYNC AUTH USERS TO PUBLIC USERS TABLE
-- ============================================

-- This script will:
-- 1. Check if users exist in auth.users but not in public.users
-- 2. Copy them over with default values
-- 3. Set up automatic syncing for future users

-- Step 1: Manually sync existing auth users to public.users
-- --------------------------------------------------------

INSERT INTO public.users (id, email, name, credits, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', 'User'),
    1000,  -- Give 1000 credits to start
    'user'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Check the results
SELECT id, email, name, credits, role, created_at
FROM public.users;


-- ============================================
-- AUTOMATIC TRIGGER (Set up once)
-- ============================================

-- This trigger will automatically create a public.users entry
-- whenever a new user is created in auth.users

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, credits, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        1000,  -- Default credits for new users
        'user' -- Default role
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- VERIFY EVERYTHING WORKS
-- ============================================

-- Check auth.users (authentication table)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check public.users (your app's user table)
SELECT 
    id,
    email,
    name,
    credits,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Check if they match
SELECT 
    'In auth.users but not in public.users' as status,
    au.id,
    au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'In public.users but not in auth.users' as status,
    pu.id,
    pu.email
FROM public.users pu
LEFT JOIN auth.users au ON au.id = pu.id
WHERE au.id IS NULL;


-- ============================================
-- MANUALLY ADD CREDITS TO EXISTING USER
-- ============================================

-- If you already created a user in Authentication and need to add them:

-- First, find the user ID from auth.users:
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- Then insert into public.users with that ID:
-- Replace 'USER_ID_HERE' with the actual UUID from above query
/*
INSERT INTO public.users (id, email, name, credits, role)
VALUES (
    'USER_ID_HERE'::uuid,  -- Replace with actual UUID
    'test@example.com',
    'Test User',
    1000,
    'user'
)
ON CONFLICT (id) DO UPDATE
SET credits = 1000;
*/

-- OR use this dynamic version:
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'test@example.com'
    LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        -- Insert or update in public.users
        INSERT INTO public.users (id, email, name, credits, role)
        VALUES (
            user_uuid,
            'test@example.com',
            'Test User',
            1000,
            'user'
        )
        ON CONFLICT (id) DO UPDATE
        SET credits = 1000, role = 'user';
        
        RAISE NOTICE 'User synced! ID: %', user_uuid;
        RAISE NOTICE 'Email: test@example.com';
        RAISE NOTICE 'Credits: 1000';
    ELSE
        RAISE NOTICE 'User not found in auth.users. Please create user via Dashboard first.';
    END IF;
END $$;


-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Count users in each table
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.users) as public_users_count;

-- If auth.users has users but public.users doesn't, run the sync:
INSERT INTO public.users (id, email, name, credits, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', 'User'),
    1000,
    'user'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

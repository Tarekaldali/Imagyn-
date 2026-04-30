-- ============================================
-- CREATE TEST USER IN SUPABASE
-- ============================================

-- Method 1: Use Supabase Dashboard (RECOMMENDED - EASIEST)
-- --------------------------------------------------------
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: test@example.com
-- 4. Password: testpassword123
-- 5. ✅ CHECK "Auto Confirm User"
-- 6. Click "Create user"
-- 7. Then run this to add credits:

UPDATE public.users
SET credits = 1000
WHERE email = 'test@example.com';


-- Method 2: SIMPLIFIED - Just add to public.users (RECOMMENDED IF SQL)
-- --------------------------------------------------------
-- This method creates a user entry that will work with service_role key
-- The user will be created in auth automatically on first login

DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert into public.users (your app's user table)
    INSERT INTO public.users (
        id,
        email,
        name,
        credits,
        role
    )
    VALUES (
        new_user_id,
        'test@example.com',
        'Test User',
        1000,
        'user'
    )
    ON CONFLICT (email) DO UPDATE
    SET credits = 1000;
    
    RAISE NOTICE 'User entry created with ID: %', new_user_id;
    RAISE NOTICE 'Now create auth user via Dashboard: Authentication -> Users -> Add user';
    RAISE NOTICE 'Email: test@example.com, Password: testpassword123';
END $$;


-- Method 2B: Try inserting into auth (without ON CONFLICT)
-- --------------------------------------------------------
-- Only use this if Method 2 doesn't work and you can't use Dashboard

DO $$
DECLARE
    new_user_id uuid;
    user_exists boolean;
BEGIN
    -- Check if user already exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'test@example.com') INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'User already exists in auth.users';
        -- Get the existing user ID
        SELECT id INTO new_user_id FROM auth.users WHERE email = 'test@example.com';
    ELSE
        -- Generate a new UUID for the user
        new_user_id := gen_random_uuid();
        
        -- Insert into auth.users (Supabase Auth table)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_sent_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            new_user_id,
            'authenticated',
            'authenticated',
            'test@example.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Auth user created';
    END IF;
    
    -- Insert/update public.users
    INSERT INTO public.users (
        id,
        email,
        name,
        credits,
        role
    )
    VALUES (
        new_user_id,
        'test@example.com',
        'Test User',
        1000,
        'user'
    )
    ON CONFLICT (email) DO UPDATE
    SET credits = 1000;
    
    RAISE NOTICE 'User created with ID: %', new_user_id;
    RAISE NOTICE 'Email: test@example.com';
    RAISE NOTICE 'Password: testpassword123';
END $$;


-- Method 3: Create admin user
-- --------------------------------------------------------

DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    admin_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        admin_user_id,
        'authenticated',
        'authenticated',
        'admin@example.com',
        crypt('adminpassword123', gen_salt('bf')),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO public.users (
        id,
        email,
        name,
        credits,
        role
    )
    VALUES (
        admin_user_id,
        'admin@example.com',
        'Admin User',
        10000,
        'admin'
    )
    ON CONFLICT (email) DO UPDATE
    SET credits = 10000, role = 'admin';
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
END $$;


-- ============================================
-- VERIFY USERS WERE CREATED
-- ============================================

-- Check auth.users table
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('test@example.com', 'admin@example.com');

-- Check public.users table
SELECT id, email, name, credits, role, created_at
FROM public.users
WHERE email IN ('test@example.com', 'admin@example.com');


-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If user already exists but has no credits:
UPDATE public.users
SET credits = 1000
WHERE email = 'test@example.com';

-- If you need to delete and start over:
-- DELETE FROM auth.users WHERE email = 'test@example.com';
-- DELETE FROM public.users WHERE email = 'test@example.com';


-- ============================================
-- GET JWT TOKEN FOR TESTING
-- ============================================

-- After creating user, you can get a token using this curl command in PowerShell:
/*

$headers = @{
    "apikey" = "YOUR_SUPABASE_ANON_KEY_HERE"
    "Content-Type" = "application/json"
}

$body = @{
    email = "test@example.com"
    password = "testpassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers $headers `
    -Body $body

*/

-- The response will contain an "access_token" field - that's your JWT token!

-- ============================================
-- DIAGNOSE AND FIX USER ID MISMATCH
-- ============================================

-- Step 1: Get the ID from your JWT token
-- Your JWT shows: "sub": "2bd4299f-6a30-4027-a4c8-e9bad08b3041"
-- This is the user ID in auth.users

-- Step 2: Check if this ID exists in public.users
SELECT 
    id,
    email,
    name,
    credits,
    role
FROM public.users
WHERE id = '2bd4299f-6a30-4027-a4c8-e9bad08b3041';

-- If the query above returns NO ROWS, that's your problem!

-- Step 3: Check what IDs ARE in public.users for test@example.com
SELECT 
    id,
    email,
    name,
    credits,
    role
FROM public.users
WHERE email = 'test@example.com';

-- Step 4: FIX IT - Insert the user with the correct ID from auth.users
INSERT INTO public.users (id, email, name, credits, role)
VALUES (
    '2bd4299f-6a30-4027-a4c8-e9bad08b3041',  -- ID from your JWT token
    'test@example.com',
    'Test User',
    1000,
    'user'
)
ON CONFLICT (id) 
DO UPDATE SET 
    email = EXCLUDED.email,
    credits = 1000;

-- Step 5: Verify it worked
SELECT 
    id,
    email,
    name,
    credits,
    role
FROM public.users
WHERE id = '2bd4299f-6a30-4027-a4c8-e9bad08b3041';

-- You should now see:
-- id: 2bd4299f-6a30-4027-a4c8-e9bad08b3041
-- email: test@example.com
-- credits: 1000
-- role: user

-- ============================================
-- NOW TRY THE API AGAIN!
-- ============================================

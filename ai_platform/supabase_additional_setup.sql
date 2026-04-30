-- ============================================
-- ADDITIONAL SCHEMA ITEMS FOR YOUR SUPABASE
-- Run these in Supabase SQL Editor to complete setup
-- ============================================

-- 1. CREATE INDEXES (for better performance)
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_job_id ON public.images(job_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_status ON public.images(status);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON public.users(plan_id);


-- ============================================
-- 2. CREATE POSTGRESQL FUNCTIONS
-- ============================================

-- Function to deduct credits from user (atomic operation)
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id uuid,
    p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_credits integer;
BEGIN
    -- Lock the row for update
    SELECT credits INTO current_credits
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF current_credits < p_amount THEN
        RETURN false;
    END IF;
    
    -- Deduct credits
    UPDATE public.users
    SET credits = credits - p_amount
    WHERE id = p_user_id;
    
    RETURN true;
END;
$$;

-- Function to add credits to user
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id uuid,
    p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET credits = credits + p_amount
    WHERE id = p_user_id;
    
    RETURN true;
END;
$$;


-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- USERS table policies
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users"
    ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- IMAGES table policies
CREATE POLICY "Users can view own images"
    ON public.images
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
    ON public.images
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
    ON public.images
    FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all images"
    ON public.images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- JOBS table policies
CREATE POLICY "Users can view own jobs"
    ON public.jobs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
    ON public.jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update jobs"
    ON public.jobs
    FOR UPDATE
    USING (true);

CREATE POLICY "Admins can view all jobs"
    ON public.jobs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- TRANSACTIONS table policies
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
    ON public.transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- PLANS table policies (everyone can read plans)
CREATE POLICY "Anyone can view active plans"
    ON public.plans
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage plans"
    ON public.plans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ============================================
-- 5. CREATE ANALYTICS VIEWS (Optional but useful)
-- ============================================

-- Daily image generation statistics
CREATE OR REPLACE VIEW public.daily_image_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_images,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(generation_time) as avg_generation_time
FROM public.images
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top users by image count
CREATE OR REPLACE VIEW public.top_users AS
SELECT
    u.id,
    u.email,
    u.name,
    COUNT(i.id) as total_images,
    u.credits
FROM public.users u
LEFT JOIN public.images i ON u.id = i.user_id
GROUP BY u.id, u.email, u.name, u.credits
ORDER BY total_images DESC
LIMIT 100;

-- System statistics
CREATE OR REPLACE VIEW public.system_stats AS
SELECT
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.images) as total_images,
    (SELECT COUNT(*) FROM public.jobs WHERE status = 'pending') as pending_jobs,
    (SELECT COUNT(*) FROM public.jobs WHERE status = 'processing') as processing_jobs,
    (SELECT AVG(generation_time) FROM public.images WHERE created_at > NOW() - INTERVAL '24 hours') as avg_generation_time_24h;


-- ============================================
-- 6. INSERT SAMPLE PLANS (Optional)
-- ============================================

INSERT INTO public.plans (name, price, credits, duration_days, description, is_active)
VALUES
    ('Free', 0, 100, 30, 'Perfect for trying out the platform', true),
    ('Starter', 9.99, 500, 30, 'Great for casual users', true),
    ('Pro', 29.99, 2000, 30, 'For regular creators', true),
    ('Enterprise', 99.99, 10000, 30, 'Unlimited power for professionals', true)
ON CONFLICT DO NOTHING;


-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to authenticated users (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits TO authenticated;

-- Grant select on views
GRANT SELECT ON public.daily_image_stats TO authenticated;
GRANT SELECT ON public.top_users TO authenticated;
GRANT SELECT ON public.system_stats TO authenticated;


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if indexes were created
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check if policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check plans
SELECT * FROM public.plans;

-- ============================================
-- DONE! ✅
-- ============================================

-- Your database is now fully configured with:
-- ✅ Indexes for performance
-- ✅ PostgreSQL functions for atomic operations
-- ✅ Row Level Security enabled
-- ✅ Security policies for all tables
-- ✅ Analytics views
-- ✅ Sample subscription plans
-- ✅ Proper permissions

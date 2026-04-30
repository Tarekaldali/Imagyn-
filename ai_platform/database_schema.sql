-- ============================================
-- AI Image Generation Platform - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 100 CHECK (credits >= 0),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    credits INTEGER NOT NULL CHECK (credits > 0),
    duration_days INTEGER CHECK (duration_days > 0),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    model_name VARCHAR(100),
    gpu_time FLOAT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images Table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    model_used VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    generation_time FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    credits_added INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'refund', 'bonus', 'deduction')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Images indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_job_id ON images(job_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to deduct credits atomically
CREATE OR REPLACE FUNCTION deduct_credits(
    user_id_param UUID,
    credits_param INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO current_credits
    FROM users
    WHERE id = user_id_param
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF current_credits IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF current_credits < credits_param THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE users
    SET credits = credits - credits_param
    WHERE id = user_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits
CREATE OR REPLACE FUNCTION add_credits(
    user_id_param UUID,
    credits_param INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users
    SET credits = credits + credits_param
    WHERE id = user_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Images policies
CREATE POLICY "Users can view own images" ON images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all images" ON images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Plans policies (public read)
CREATE POLICY "Anyone can view active plans" ON plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage plans" ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample plans
INSERT INTO plans (name, price, credits, duration_days, description) VALUES
    ('Starter', 9.99, 100, 30, 'Perfect for trying out our service'),
    ('Pro', 29.99, 500, 30, 'For regular users and small projects'),
    ('Business', 99.99, 2000, 30, 'For businesses and power users'),
    ('Enterprise', 299.99, 10000, 30, 'Unlimited generation power')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp (if you add this column)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Daily image generation stats
CREATE OR REPLACE VIEW daily_image_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_images,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(generation_time) as avg_generation_time
FROM images
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top users by image count
CREATE OR REPLACE VIEW top_users AS
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(i.id) as image_count,
    SUM(i.generation_time) as total_gpu_time
FROM users u
LEFT JOIN images i ON u.id = i.user_id
WHERE i.status = 'completed'
GROUP BY u.id, u.name, u.email
ORDER BY image_count DESC;

-- System stats
CREATE OR REPLACE VIEW system_stats AS
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM images WHERE status = 'completed') as total_images,
    (SELECT COUNT(*) FROM jobs WHERE status = 'pending') as pending_jobs,
    (SELECT SUM(gpu_time) FROM jobs WHERE status = 'completed') as total_gpu_time,
    (SELECT SUM(amount) FROM transactions WHERE status = 'completed') as total_revenue;

-- ============================================
-- GRANTS (If needed)
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT ON images TO authenticated;
GRANT SELECT, INSERT ON jobs TO authenticated;
GRANT SELECT ON plans TO authenticated;
GRANT SELECT ON transactions TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify everything is set up correctly:
-- SELECT * FROM users LIMIT 5;
-- SELECT * FROM plans;
-- SELECT * FROM system_stats;

COMMENT ON TABLE users IS 'User accounts with credits and roles';
COMMENT ON TABLE images IS 'Generated images with metadata';
COMMENT ON TABLE jobs IS 'Image generation jobs and status';
COMMENT ON TABLE transactions IS 'Credit purchase and usage transactions';
COMMENT ON TABLE plans IS 'Subscription and credit plans';

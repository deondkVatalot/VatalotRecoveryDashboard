-- First, disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE data DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "data_policy" ON data;
DROP POLICY IF EXISTS "data_imports_policy" ON data_imports;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policy
CREATE POLICY "users_policy" ON users AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        id = auth.uid() 
        OR role = 'admin'
        OR email IN ('admin@vatalot.com', 'user@vatalot.com')
    )
    WITH CHECK (
        id = auth.uid() 
        OR role = 'admin'
        OR email IN ('admin@vatalot.com', 'user@vatalot.com')
        OR NOT EXISTS (SELECT 1 FROM users)
    );

-- Data table policy
CREATE POLICY "data_policy" ON data AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Data imports table policy
CREATE POLICY "data_imports_policy" ON data_imports AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure demo users exist
INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    password_hash,
    company,
    role,
    status,
    theme
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'User',
    'admin@vatalot.com',
    'Vatalot2024',
    'Vatalot',
    'admin',
    'enabled',
    'light'
), (
    '00000000-0000-0000-0000-000000000002',
    'Regular',
    'User',
    'user@vatalot.com',
    'VatalotUser2024',
    'Vatalot',
    'user',
    'enabled',
    'light'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    status = EXCLUDED.status;
-- First, disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE data DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for own record and admins" ON users;
DROP POLICY IF EXISTS "Enable insert for admins and initial setup" ON users;
DROP POLICY IF EXISTS "Enable update for own record and admins" ON users;
DROP POLICY IF EXISTS "Enable delete for admins only" ON users;
DROP POLICY IF EXISTS "Enable read access for own data and admins" ON data;
DROP POLICY IF EXISTS "Enable insert for own data and admins" ON data;
DROP POLICY IF EXISTS "Enable update for own data and admins" ON data;
DROP POLICY IF EXISTS "Enable delete for own data and admins" ON data;
DROP POLICY IF EXISTS "Enable read access for own imports and admins" ON data_imports;
DROP POLICY IF EXISTS "Enable insert for own imports and admins" ON data_imports;
DROP POLICY IF EXISTS "Enable update for own imports and admins" ON data_imports;
DROP POLICY IF EXISTS "Enable delete for own imports and admins" ON data_imports;

-- Recreate admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow if no users exist (for initial setup)
    IF NOT EXISTS (SELECT 1 FROM users) THEN
        RETURN TRUE;
    END IF;

    -- Check if current user is admin
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies for users table
CREATE POLICY "users_policy" ON users
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        -- For SELECT, UPDATE, DELETE
        is_admin()
        OR id = auth.uid()
        OR email IN ('admin@vatalot.com', 'user@vatalot.com')
    )
    WITH CHECK (
        -- For INSERT, UPDATE
        is_admin()
        OR id = auth.uid()
        OR email IN ('admin@vatalot.com', 'user@vatalot.com')
        OR NOT EXISTS (SELECT 1 FROM users)  -- Allow if no users exist
    );

-- Create simplified policies for data table
CREATE POLICY "data_policy" ON data
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        is_admin()
        OR created_by = auth.uid()
    )
    WITH CHECK (
        is_admin()
        OR created_by = auth.uid()
    );

-- Create simplified policies for data_imports table
CREATE POLICY "data_imports_policy" ON data_imports
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        is_admin()
        OR user_id = auth.uid()
    )
    WITH CHECK (
        is_admin()
        OR user_id = auth.uid()
    );

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON data TO authenticated;
GRANT ALL ON data_imports TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert or update demo users if they don't exist
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
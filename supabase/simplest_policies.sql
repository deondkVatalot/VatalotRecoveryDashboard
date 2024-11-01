-- First, disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE data DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "data_policy" ON data;
DROP POLICY IF EXISTS "data_imports_policy" ON data_imports;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON data;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON data_imports;

-- Drop and recreate admin function
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Create the simplest possible policies
CREATE POLICY "allow_all_users"
    ON users FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_data"
    ON data FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_imports"
    ON data_imports FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;

-- Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;

-- Ensure demo users exist with correct permissions
DELETE FROM users WHERE email IN ('admin@vatalot.com', 'user@vatalot.com');
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
);
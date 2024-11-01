-- First, disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE data DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "data_policy" ON data;
DROP POLICY IF EXISTS "data_imports_policy" ON data_imports;

-- Drop any other existing policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on role" ON users;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Create basic policies that we know work
CREATE POLICY "Enable read access for authenticated users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON users FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
    ON users FOR DELETE
    TO authenticated
    USING (true);

-- Similar policies for data and data_imports
CREATE POLICY "Enable all for authenticated users"
    ON data FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users"
    ON data_imports FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

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
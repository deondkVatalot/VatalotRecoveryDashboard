-- First, temporarily disable RLS to allow policy updates
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on role" ON users;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Recreate the is_admin function with better handling
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- First check if any users exist
    IF NOT EXISTS (SELECT 1 FROM users) THEN
        RETURN TRUE;
    END IF;

    -- Then check if the current user is an admin
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simpler, more permissive policies for the users table
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

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions explicitly
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Insert or update demo users with explicit permissions
DO $$
BEGIN
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
    )
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status;
END;
$$;
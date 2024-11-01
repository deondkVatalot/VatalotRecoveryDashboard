-- First, drop existing policies
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON data;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON data_imports;

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

-- Users table policies
CREATE POLICY "Enable read access for own record and admins"
    ON users FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() 
        OR is_admin() 
        OR email IN ('admin@vatalot.com', 'user@vatalot.com')
    );

CREATE POLICY "Enable insert for admins and initial setup"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Allow if no users exist (first user)
        NOT EXISTS (SELECT 1 FROM users)
        -- Or if user is admin
        OR is_admin()
        -- Or if inserting demo users
        OR email IN ('admin@vatalot.com', 'user@vatalot.com')
    );

CREATE POLICY "Enable update for own record and admins"
    ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR is_admin())
    WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY "Enable delete for admins only"
    ON users FOR DELETE
    TO authenticated
    USING (is_admin());

-- Data table policies
CREATE POLICY "Enable read access for own data and admins"
    ON data FOR SELECT
    TO authenticated
    USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Enable insert for own data and admins"
    ON data FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid() OR is_admin());

CREATE POLICY "Enable update for own data and admins"
    ON data FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR is_admin())
    WITH CHECK (created_by = auth.uid() OR is_admin());

CREATE POLICY "Enable delete for own data and admins"
    ON data FOR DELETE
    TO authenticated
    USING (created_by = auth.uid() OR is_admin());

-- Data imports table policies
CREATE POLICY "Enable read access for own imports and admins"
    ON data_imports FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Enable insert for own imports and admins"
    ON data_imports FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Enable update for own imports and admins"
    ON data_imports FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Enable delete for own imports and admins"
    ON data_imports FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON data TO authenticated;
GRANT ALL ON data_imports TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
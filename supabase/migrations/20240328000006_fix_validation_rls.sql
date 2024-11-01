-- First, drop existing policies
DROP POLICY IF EXISTS "Enable read access for own validations and admins" ON data_validation;
DROP POLICY IF EXISTS "Enable insert for own validations and admins" ON data_validation;
DROP POLICY IF EXISTS "Enable update for own validations and admins" ON data_validation;
DROP POLICY IF EXISTS "Enable delete for own validations and admins" ON data_validation;

-- Create new policies matching the data table policies
CREATE POLICY "Enable read access for authenticated users"
    ON data_validation FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "Enable insert access for authenticated users"
    ON data_validation FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "Enable update for authenticated users"
    ON data_validation FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "Enable delete for authenticated users"
    ON data_validation FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

-- Ensure proper permissions are granted
GRANT ALL ON data_validation TO authenticated;
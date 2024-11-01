-- First, disable RLS temporarily
ALTER TABLE data_validation DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON data_validation;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON data_validation;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON data_validation;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON data_validation;

-- Create a single, simple policy for all operations
CREATE POLICY "allow_all_authenticated_users"
    ON data_validation FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE data_validation ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON data_validation TO authenticated;
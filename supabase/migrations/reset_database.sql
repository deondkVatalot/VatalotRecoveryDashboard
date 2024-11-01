-- First, drop everything with CASCADE to handle dependencies
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Reset default privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create an admin check function first (before any tables that might use it)
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

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('enabled', 'disabled')),
    theme VARCHAR(50) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create data_imports table
CREATE TABLE data_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    record_count INTEGER NOT NULL,
    imported_by VARCHAR(255) NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create data table
CREATE TABLE data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(255),
    trans_id VARCHAR(255),
    account VARCHAR(255),
    aname VARCHAR(255),
    reference VARCHAR(255),
    description TEXT,
    amount DECIMAL(15, 2),
    vat DECIMAL(15, 2),
    flag VARCHAR(10),
    verified VARCHAR(10),
    status VARCHAR(50),
    notes TEXT,
    import_id UUID REFERENCES data_imports(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create schema cache table
CREATE TABLE schema_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(255) NOT NULL,
    is_nullable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_name, column_name)
);

-- Create indexes
CREATE INDEX idx_data_created_by ON data(created_by);
CREATE INDEX idx_data_import_id ON data(import_id);
CREATE INDEX idx_data_imports_user_id ON data_imports(user_id);
CREATE INDEX idx_data_imports_imported_at ON data_imports(imported_at);
CREATE INDEX idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER data_updated_at_trigger
    BEFORE UPDATE ON data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER data_imports_updated_at_trigger
    BEFORE UPDATE ON data_imports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER schema_cache_updated_at_trigger
    BEFORE UPDATE ON schema_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert schema cache data
INSERT INTO schema_cache (table_name, column_name, data_type, is_nullable)
VALUES 
    ('data', 'date', 'VARCHAR(255)', true),
    ('data', 'trans_id', 'VARCHAR(255)', true),
    ('data', 'account', 'VARCHAR(255)', true),
    ('data', 'aname', 'VARCHAR(255)', true),
    ('data', 'reference', 'VARCHAR(255)', true),
    ('data', 'description', 'TEXT', true),
    ('data', 'amount', 'DECIMAL(15,2)', true),
    ('data', 'vat', 'DECIMAL(15,2)', true),
    ('data', 'flag', 'VARCHAR(10)', true),
    ('data', 'verified', 'VARCHAR(10)', true),
    ('data', 'status', 'VARCHAR(50)', true),
    ('data', 'notes', 'TEXT', true),
    ('data', 'import_id', 'UUID', true)
ON CONFLICT (table_name, column_name) DO NOTHING;

-- Insert demo users if they don't exist
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
) ON CONFLICT (email) DO NOTHING;

-- Grant basic access to public tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_cache ENABLE ROW LEVEL SECURITY;

-- Users table policies (Exactly matching Supabase configuration)
CREATE POLICY "Enable insert access for authenticated users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        (NOT EXISTS (SELECT 1 FROM users)) OR 
        is_admin() OR 
        (email::text = ANY (ARRAY['admin@vatalot.com'::text, 'user@vatalot.com'::text]))
    );

CREATE POLICY "Enable update for users based on role"
    ON users FOR UPDATE
    TO authenticated
    USING ((id = auth.uid()) OR is_admin())
    WITH CHECK ((id = auth.uid()) OR is_admin());

CREATE POLICY "Enable delete for admin users only"
    ON users FOR DELETE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Enable read access for authenticated users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

-- Data table policies
CREATE POLICY "Enable read access for authenticated users"
    ON data FOR SELECT
    TO authenticated
    USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Enable insert access for authenticated users"
    ON data FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid() OR is_admin());

CREATE POLICY "Enable update for authenticated users"
    ON data FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Enable delete for authenticated users"
    ON data FOR DELETE
    TO authenticated
    USING (created_by = auth.uid() OR is_admin());

-- Data imports table policies
CREATE POLICY "Enable read access for authenticated users"
    ON data_imports FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Enable insert access for authenticated users"
    ON data_imports FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Enable update for own records"
    ON data_imports FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Enable delete for own records"
    ON data_imports FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- Schema cache table policies
CREATE POLICY "Enable read access for authenticated users"
    ON schema_cache FOR SELECT
    TO authenticated
    USING (true);

-- Ensure the anon role can sign in
GRANT anon TO authenticated;
-- First, drop everything
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Reset default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
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

-- Create indexes
CREATE INDEX idx_data_created_by ON data(created_by);
CREATE INDEX idx_data_import_id ON data(import_id);
CREATE INDEX idx_data_imports_user_id ON data_imports(user_id);
CREATE INDEX idx_data_imports_imported_at ON data_imports(imported_at);
CREATE INDEX idx_users_email ON users(email);

-- Insert demo users
INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    password_hash,
    company,
    role,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'User',
    'admin@vatalot.com',
    'Vatalot2024',
    'Vatalot',
    'admin',
    'enabled'
), (
    '00000000-0000-0000-0000-000000000002',
    'Regular',
    'User',
    'user@vatalot.com',
    'VatalotUser2024',
    'Vatalot',
    'user',
    'enabled'
) ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;

-- Grant basic access to public and anon roles
GRANT USAGE ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on users table to anon for login
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- Grant full access to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON data TO authenticated;
GRANT ALL ON data_imports TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create public policies for users table
CREATE POLICY "Allow public read access to users"
    ON users FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable full access for authenticated users"
    ON users FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for data table
CREATE POLICY "Enable full access for authenticated users"
    ON data FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for data_imports table
CREATE POLICY "Enable full access for authenticated users"
    ON data_imports FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
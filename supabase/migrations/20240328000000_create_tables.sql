-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table first (since other tables reference it)
CREATE TABLE IF NOT EXISTS users (
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

-- Create data_imports table (since data table references it)
CREATE TABLE IF NOT EXISTS data_imports (
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

-- Create data table with all references
CREATE TABLE IF NOT EXISTS data (
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
CREATE TABLE IF NOT EXISTS schema_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(255) NOT NULL,
    is_nullable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_name, column_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_created_by ON data(created_by);
CREATE INDEX IF NOT EXISTS idx_data_import_id ON data(import_id);
CREATE INDEX IF NOT EXISTS idx_data_imports_user_id ON data_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_imports_imported_at ON data_imports(imported_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
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
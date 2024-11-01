-- Drop existing tables (in correct order due to dependencies)
DROP TABLE IF EXISTS data_validation_records CASCADE;
DROP TABLE IF EXISTS data_validation CASCADE;

-- Create data validation table for storing validation batches
CREATE TABLE data_validation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create data validation records table for storing individual records
CREATE TABLE data_validation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id UUID NOT NULL REFERENCES data_validation(id) ON DELETE CASCADE,
    date VARCHAR(255),
    trans_id VARCHAR(255),
    account VARCHAR(255),
    aname VARCHAR(255),
    reference VARCHAR(255),
    description TEXT,
    amount DECIMAL(15, 2),
    vat DECIMAL(15, 2),
    has_error BOOLEAN DEFAULT false,
    error_fields TEXT[], -- Changed from JSONB to TEXT[]
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_data_validation_created_by ON data_validation(created_by);
CREATE INDEX idx_validation_records_validation_id ON data_validation_records(validation_id);
CREATE INDEX idx_validation_records_created_by ON data_validation_records(created_by);
CREATE INDEX idx_validation_records_has_error ON data_validation_records(has_error);

-- Enable RLS
ALTER TABLE data_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_records ENABLE ROW LEVEL SECURITY;

-- Create simple policies for both tables
CREATE POLICY "allow_all_authenticated_users"
    ON data_validation
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_users"
    ON data_validation_records
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON data_validation TO authenticated;
GRANT ALL ON data_validation_records TO authenticated;
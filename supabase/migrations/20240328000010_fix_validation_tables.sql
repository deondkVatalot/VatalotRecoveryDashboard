-- First, drop existing tables (in correct order due to dependencies)
DROP TABLE IF EXISTS data_validation_records CASCADE;
DROP TABLE IF EXISTS data_validation CASCADE;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_data_validation_created_by ON data_validation(created_by);
CREATE INDEX idx_validation_records_validation_id ON data_validation_records(validation_id);
CREATE INDEX idx_validation_records_created_by ON data_validation_records(created_by);
CREATE INDEX idx_validation_records_has_error ON data_validation_records(has_error);

-- Create triggers for updated_at
CREATE TRIGGER data_validation_updated_at_trigger
    BEFORE UPDATE ON data_validation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER data_validation_records_updated_at_trigger
    BEFORE UPDATE ON data_validation_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE data_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_records ENABLE ROW LEVEL SECURITY;

-- Create simple policies for both tables
CREATE POLICY "data_validation_policy"
    ON data_validation
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ))
    WITH CHECK (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "data_validation_records_policy"
    ON data_validation_records
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ))
    WITH CHECK (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

-- Grant necessary permissions
GRANT ALL ON data_validation TO authenticated;
GRANT ALL ON data_validation_records TO authenticated;
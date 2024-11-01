-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create data validation table for storing validation batches
CREATE TABLE IF NOT EXISTS data_validation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    record_count INTEGER NOT NULL,
    validated_by VARCHAR(255) NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    has_errors BOOLEAN DEFAULT false,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create data validation records table for storing individual records
CREATE TABLE IF NOT EXISTS data_validation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id UUID NOT NULL REFERENCES data_validation(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date VARCHAR(255),
    trans_id VARCHAR(255),
    account VARCHAR(255),
    aname VARCHAR(255),
    reference VARCHAR(255),
    description TEXT,
    amount DECIMAL(15, 2),
    vat DECIMAL(15, 2),
    has_error BOOLEAN DEFAULT false,
    error_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_validation_user_id ON data_validation(user_id);
CREATE INDEX IF NOT EXISTS idx_data_validation_validated_at ON data_validation(validated_at);
CREATE INDEX IF NOT EXISTS idx_data_validation_has_errors ON data_validation(has_errors);

CREATE INDEX IF NOT EXISTS idx_validation_records_validation_id ON data_validation_records(validation_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_user_id ON data_validation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_has_error ON data_validation_records(has_error);

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
CREATE POLICY "allow_all_authenticated_users"
    ON data_validation FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_users"
    ON data_validation_records FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON data_validation TO authenticated;
GRANT ALL ON data_validation_records TO authenticated;

-- Create view for validation records summary
CREATE OR REPLACE VIEW validation_records_summary AS
SELECT 
    validation_id,
    COUNT(*) as total_records,
    SUM(CASE WHEN has_error THEN 1 ELSE 0 END) as error_records,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM data_validation_records
GROUP BY validation_id;

-- Grant access to the view
GRANT SELECT ON validation_records_summary TO authenticated;
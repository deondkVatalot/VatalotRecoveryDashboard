-- Create data_validation_records table
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
CREATE INDEX IF NOT EXISTS idx_validation_records_validation_id ON data_validation_records(validation_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_user_id ON data_validation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_has_error ON data_validation_records(has_error);

-- Create trigger for updated_at
CREATE TRIGGER data_validation_records_updated_at_trigger
    BEFORE UPDATE ON data_validation_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE data_validation_records ENABLE ROW LEVEL SECURITY;

-- Create a single, simple policy for all operations
CREATE POLICY "allow_all_authenticated_users"
    ON data_validation_records FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
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
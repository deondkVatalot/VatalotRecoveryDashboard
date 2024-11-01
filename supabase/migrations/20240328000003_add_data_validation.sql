-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create data validation table
CREATE TABLE IF NOT EXISTS data_validation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    record_count INTEGER NOT NULL,
    validated_by VARCHAR(255) NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    has_errors BOOLEAN DEFAULT false,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_validation_user_id ON data_validation(user_id);
CREATE INDEX IF NOT EXISTS idx_data_validation_validated_at ON data_validation(validated_at);
CREATE INDEX IF NOT EXISTS idx_data_validation_has_errors ON data_validation(has_errors);

-- Create trigger for updated_at
CREATE TRIGGER data_validation_updated_at_trigger
    BEFORE UPDATE ON data_validation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE data_validation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for own validations and admins"
    ON data_validation FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "Enable insert for own validations and admins"
    ON data_validation FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "Enable update for own validations and admins"
    ON data_validation FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ))
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

CREATE POLICY "Enable delete for own validations and admins"
    ON data_validation FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'enabled'
    ));

-- Grant necessary permissions
GRANT ALL ON data_validation TO authenticated;
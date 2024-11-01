-- Add import_id to data table
ALTER TABLE data
ADD COLUMN import_id UUID REFERENCES data_imports(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_data_import_id ON data(import_id);
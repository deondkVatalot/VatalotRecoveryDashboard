-- Add new settings column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "fontSize": "medium",
  "language": "en",
  "layout": "default"
}'::jsonb;

-- Update existing users with default settings if null
UPDATE users 
SET settings = '{
  "fontSize": "medium",
  "language": "en",
  "layout": "default"
}'::jsonb
WHERE settings IS NULL;
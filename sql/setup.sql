-- Update demo users with plain text passwords temporarily
UPDATE users 
SET password_hash = 'Vatalot2024'
WHERE email = 'admin@vatalot.com';

UPDATE users 
SET password_hash = 'VatalotUser2024'
WHERE email = 'user@vatalot.com';
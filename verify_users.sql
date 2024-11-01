-- Check existing users and their password hashes
SELECT 
    email,
    password_hash,
    role,
    status
FROM users
WHERE email IN ('admin@vatalot.com', 'user@vatalot.com');
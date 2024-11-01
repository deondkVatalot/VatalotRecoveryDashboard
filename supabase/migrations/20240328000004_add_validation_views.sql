-- Create view for validation statistics
CREATE OR REPLACE VIEW validation_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_validations,
    SUM(CASE WHEN has_errors THEN 1 ELSE 0 END) as validations_with_errors,
    SUM(error_count) as total_errors,
    MAX(validated_at) as last_validation,
    AVG(record_count) as avg_records_per_validation
FROM data_validation
GROUP BY user_id;

-- Create view for recent validations
CREATE OR REPLACE VIEW recent_validations AS
SELECT 
    dv.*,
    u.first_name || ' ' || u.last_name as validator_name,
    u.email as validator_email
FROM data_validation dv
JOIN users u ON dv.user_id = u.id
WHERE validated_at >= NOW() - INTERVAL '30 days'
ORDER BY validated_at DESC;

-- Grant access to views
GRANT SELECT ON validation_statistics TO authenticated;
GRANT SELECT ON recent_validations TO authenticated;
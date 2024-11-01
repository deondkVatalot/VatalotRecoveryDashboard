-- Function to get validation summary
CREATE OR REPLACE FUNCTION get_validation_summary(p_user_id UUID)
RETURNS TABLE (
    total_validations BIGINT,
    validations_with_errors BIGINT,
    total_errors BIGINT,
    last_validation TIMESTAMP WITH TIME ZONE,
    avg_records_per_validation NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_validations,
        SUM(CASE WHEN has_errors THEN 1 ELSE 0 END)::BIGINT as validations_with_errors,
        SUM(error_count)::BIGINT as total_errors,
        MAX(validated_at) as last_validation,
        AVG(record_count)::NUMERIC as avg_records_per_validation
    FROM data_validation
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get validation details
CREATE OR REPLACE FUNCTION get_validation_details(p_validation_id UUID)
RETURNS TABLE (
    filename VARCHAR,
    validated_by VARCHAR,
    validated_at TIMESTAMP WITH TIME ZONE,
    record_count INTEGER,
    has_errors BOOLEAN,
    error_count INTEGER,
    data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.filename,
        dv.validated_by,
        dv.validated_at,
        dv.record_count,
        dv.has_errors,
        dv.error_count,
        dv.data
    FROM data_validation dv
    WHERE dv.id = p_validation_id
    AND (
        dv.user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
            AND status = 'enabled'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_validation_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_validation_details TO authenticated;
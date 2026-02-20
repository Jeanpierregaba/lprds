-- Diagnostic query to check daily_reports table constraints and data issues
-- This will help identify why the save operation might be failing

-- Check table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_reports' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any check constraints on the table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'daily_reports'::regclass 
    AND contype = 'c';

-- Check for any data that might violate constraints
SELECT 
    'mood' as field_name,
    mood as field_value,
    id as report_id,
    report_date
FROM daily_reports 
WHERE mood IS NOT NULL 
    AND NOT (jsonb_typeof(mood) = 'array')
LIMIT 5;

SELECT 
    'status' as field_name,
    status as field_value,
    id as report_id,
    report_date
FROM daily_reports 
WHERE status IS NOT NULL 
    AND status NOT IN ('draft', 'pending', 'validated', 'rejected')
LIMIT 5;

-- Check for reports with invalid mood values (if mood is array)
SELECT 
    id,
    report_date,
    mood,
    status
FROM daily_reports 
WHERE mood IS NOT NULL 
    AND jsonb_typeof(mood) = 'array'
    AND NOT mood <@ '["joyeux", "calme", "agite", "triste", "fatigue", "grincheux"]'::jsonb
LIMIT 5;

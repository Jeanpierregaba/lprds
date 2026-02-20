-- Diagnostic query to check reports status inconsistency
-- This will help identify reports that have been rejected but still show as pending

-- Check reports with is_validated = false but status is not 'rejected'
SELECT 
    id,
    report_date,
    status,
    is_validated,
    is_draft,
    rejection_reason,
    validation_notes,
    created_at,
    updated_at
FROM public.daily_reports 
WHERE is_validated = false 
  AND status != 'rejected'
  AND is_draft = false
ORDER BY created_at DESC;

-- Check reports that have rejection_reason but status is not 'rejected'
SELECT 
    id,
    report_date,
    status,
    is_validated,
    is_draft,
    rejection_reason,
    validation_notes,
    created_at,
    updated_at
FROM public.daily_reports 
WHERE rejection_reason IS NOT NULL 
  AND status != 'rejected'
ORDER BY created_at DESC;

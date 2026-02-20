-- Force update rejected reports to have correct status
-- This will fix any reports that were rejected but still show as pending

-- Update reports that have rejection_reason but wrong status
UPDATE public.daily_reports
SET status = 'rejected'
WHERE rejection_reason IS NOT NULL 
  AND status != 'rejected';

-- Update reports that have validation_notes (rejection notes) but wrong status  
UPDATE public.daily_reports
SET status = 'rejected'
WHERE validation_notes IS NOT NULL 
  AND is_validated = false 
  AND status != 'rejected';

-- Double-check: Ensure all reports with is_validated = false and is_draft = false are 'pending'
UPDATE public.daily_reports
SET status = 'pending'
WHERE is_validated = false 
  AND is_draft = false 
  AND rejection_reason IS NULL
  AND status = 'draft';

-- Ensure all validated reports have correct status
UPDATE public.daily_reports
SET status = 'validated'
WHERE is_validated = true 
  AND status != 'validated';

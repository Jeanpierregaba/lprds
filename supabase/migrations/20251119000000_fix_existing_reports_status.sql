-- Update existing reports to have correct status based on is_validated and is_draft flags
UPDATE public.daily_reports
SET status = CASE
  WHEN is_validated = TRUE THEN 'validated'
  WHEN is_validated = FALSE AND is_draft = FALSE THEN 'pending'
  WHEN is_draft = TRUE THEN 'draft'
  ELSE 'draft'
END
WHERE status IS NULL OR status = 'draft';

-- Clear rejection reason for validated reports
UPDATE public.daily_reports
SET rejection_reason = NULL
WHERE status = 'validated' AND rejection_reason IS NOT NULL;

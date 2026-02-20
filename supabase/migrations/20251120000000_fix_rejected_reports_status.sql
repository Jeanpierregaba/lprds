-- Fix rejected reports status inconsistency
-- This migration ensures all rejected reports have the correct status and clears rejection reasons for non-rejected reports

-- First, ensure all reports with rejection_reason have status 'rejected'
UPDATE public.daily_reports
SET status = 'rejected'
WHERE rejection_reason IS NOT NULL 
  AND status != 'rejected';

-- Clear rejection_reason for reports that are not rejected
UPDATE public.daily_reports
SET rejection_reason = NULL
WHERE status != 'rejected' 
  AND rejection_reason IS NOT NULL;

-- Ensure all reports with validation_notes and is_validated = false have status 'rejected'
UPDATE public.daily_reports
SET status = 'rejected'
WHERE validation_notes IS NOT NULL 
  AND is_validated = false 
  AND status != 'rejected';

-- Clear validation_notes for reports that are not rejected
UPDATE public.daily_reports
SET validation_notes = NULL
WHERE status != 'rejected' 
  AND validation_notes IS NOT NULL;

-- Ensure all reports with is_validated = true have status 'validated'
UPDATE public.daily_reports
SET status = 'validated'
WHERE is_validated = true 
  AND status != 'validated';

-- Ensure all reports with is_draft = true have status 'draft'
UPDATE public.daily_reports
SET status = 'draft'
WHERE is_draft = true 
  AND status != 'draft';

-- Ensure all reports with is_draft = false and is_validated = false have status 'pending'
UPDATE public.daily_reports
SET status = 'pending'
WHERE is_draft = false 
  AND is_validated = false 
  AND status NOT IN ('pending', 'rejected', 'validated')
  AND rejection_reason IS NULL
  AND validation_notes IS NULL;

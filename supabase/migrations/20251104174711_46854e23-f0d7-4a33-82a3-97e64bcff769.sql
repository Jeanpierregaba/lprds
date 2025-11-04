-- Add is_draft column to daily_reports table
ALTER TABLE public.daily_reports 
ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT true;

-- Add index for faster queries on draft reports
CREATE INDEX IF NOT EXISTS idx_daily_reports_draft ON public.daily_reports(is_draft, educator_id, report_date);

-- Update existing reports to not be drafts if they are validated
UPDATE public.daily_reports 
SET is_draft = false 
WHERE is_validated = true;
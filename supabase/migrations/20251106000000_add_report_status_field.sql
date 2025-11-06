-- Add status field to daily_reports table
ALTER TABLE public.daily_reports
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'pending', 'validated', 'rejected')) DEFAULT 'draft';

-- Add rejection reason field
ALTER TABLE public.daily_reports
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update existing records: set status based on is_validated
UPDATE public.daily_reports
SET status = CASE
  WHEN is_validated = TRUE THEN 'validated'
  ELSE 'draft'
END
WHERE status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON public.daily_reports(status);
CREATE INDEX IF NOT EXISTS idx_daily_reports_educator_status ON public.daily_reports(educator_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date_status ON public.daily_reports(report_date, status);

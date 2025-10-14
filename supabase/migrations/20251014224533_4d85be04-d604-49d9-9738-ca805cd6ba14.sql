-- Add validation_notes column to daily_reports table
ALTER TABLE public.daily_reports 
ADD COLUMN validation_notes TEXT;
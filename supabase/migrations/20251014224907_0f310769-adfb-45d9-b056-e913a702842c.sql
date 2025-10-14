-- Add foreign key for educator_id in daily_reports
ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_educator_id_fkey 
FOREIGN KEY (educator_id) 
REFERENCES public.profiles(id);

-- Add foreign key for child_id in daily_reports
ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_child_id_fkey 
FOREIGN KEY (child_id) 
REFERENCES public.children(id);

-- Add foreign key for validated_by in daily_reports
ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_validated_by_fkey 
FOREIGN KEY (validated_by) 
REFERENCES public.profiles(id);
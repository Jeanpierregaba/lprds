-- Create weekly_reports table
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  educator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  validation_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and secretaries can manage all weekly reports"
ON public.weekly_reports FOR ALL
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can insert weekly reports for their assigned children"
ON public.weekly_reports FOR INSERT
WITH CHECK (
  is_educator(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = weekly_reports.child_id 
    AND c.assigned_educator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Educators can manage weekly reports for their assigned children"
ON public.weekly_reports FOR ALL
USING (
  is_educator(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = weekly_reports.child_id 
    AND c.assigned_educator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Parents can view validated weekly reports for their children"
ON public.weekly_reports FOR SELECT
USING (
  is_validated = true AND 
  child_id IN (SELECT get_parent_children(auth.uid()))
);

-- Trigger for updated_at
CREATE TRIGGER update_weekly_reports_updated_at
BEFORE UPDATE ON public.weekly_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
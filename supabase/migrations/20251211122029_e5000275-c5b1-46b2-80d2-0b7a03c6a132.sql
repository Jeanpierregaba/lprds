-- Create periodic_assessments table for children's periodic evaluations (bulletins)
CREATE TABLE public.periodic_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  educator_id UUID NOT NULL REFERENCES public.profiles(id),
  period_name TEXT NOT NULL, -- Ex: "Période 1", "Trimestre 1", etc.
  school_year TEXT NOT NULL, -- Ex: "2025-2026"
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Assessment domains as JSONB array
  -- Each domain: { domain: string, rating: 'acquis' | 'en_cours' | 'a_consolider', comment: string }
  domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Teacher's final word
  teacher_comment TEXT,
  
  -- Validation workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated', 'rejected')),
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  validation_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.periodic_assessments ENABLE ROW LEVEL SECURITY;

-- Index for faster queries
CREATE INDEX idx_periodic_assessments_child ON public.periodic_assessments(child_id);
CREATE INDEX idx_periodic_assessments_educator ON public.periodic_assessments(educator_id);
CREATE INDEX idx_periodic_assessments_date ON public.periodic_assessments(assessment_date);
CREATE INDEX idx_periodic_assessments_status ON public.periodic_assessments(status);

-- RLS Policies
-- Admins and secretaries can manage all assessments
CREATE POLICY "Admins and secretaries can manage all assessments"
ON public.periodic_assessments
FOR ALL
USING (is_admin_or_secretary(auth.uid()));

-- Educators can manage assessments for their assigned children
CREATE POLICY "Educators can manage assessments for their assigned children"
ON public.periodic_assessments
FOR ALL
USING (
  is_educator(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = periodic_assessments.child_id 
    AND c.assigned_educator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Educators can insert assessments for children assigned to them
CREATE POLICY "Educators can insert assessments for their assigned children"
ON public.periodic_assessments
FOR INSERT
WITH CHECK (
  is_educator(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = periodic_assessments.child_id 
    AND c.assigned_educator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Parents can view validated assessments for their children only
CREATE POLICY "Parents can view validated assessments for their children"
ON public.periodic_assessments
FOR SELECT
USING (
  is_validated = true 
  AND child_id IN (SELECT get_parent_children(auth.uid()))
);

-- Create trigger for updated_at
CREATE TRIGGER update_periodic_assessments_updated_at
  BEFORE UPDATE ON public.periodic_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
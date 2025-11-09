-- Create meal_plans table for weekly menu planning
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_date DATE NOT NULL UNIQUE,
  snack_morning TEXT,
  lunch TEXT NOT NULL,
  dessert TEXT,
  snack_afternoon TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Admins and secretaries can manage all meal plans
CREATE POLICY "Admins and secretaries can manage meal plans"
ON public.meal_plans
FOR ALL
TO authenticated
USING (is_admin_or_secretary(auth.uid()));

-- Staff and parents can view meal plans
CREATE POLICY "Everyone can view meal plans"
ON public.meal_plans
FOR SELECT
TO authenticated
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster date queries
CREATE INDEX idx_meal_plans_date ON public.meal_plans(plan_date DESC);
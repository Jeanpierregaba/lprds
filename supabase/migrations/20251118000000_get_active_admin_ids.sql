-- Create function to get active admin/secretary IDs
-- This function uses SECURITY DEFINER to bypass RLS restrictions
-- so parents can get admin IDs to send messages
CREATE OR REPLACE FUNCTION public.get_active_admin_ids()
RETURNS TABLE(id UUID)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id 
  FROM public.profiles p
  WHERE p.role IN ('admin', 'secretary')
    AND p.is_active = true;
$$;


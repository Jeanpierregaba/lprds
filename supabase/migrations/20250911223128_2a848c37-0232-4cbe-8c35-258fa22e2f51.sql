-- Create enum for child sections
CREATE TYPE child_section AS ENUM ('creche', 'garderie', 'maternelle_etoile', 'maternelle_soleil');

-- Create enum for group types
CREATE TYPE group_type AS ENUM ('age_group', 'mixed_group', 'class');

-- Update children table with more detailed information
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS code_qr_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS medical_info_detailed JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emergency_contacts_detailed JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS dietary_restrictions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS behavioral_notes TEXT,
ADD COLUMN IF NOT EXISTS preferences TEXT,
ADD COLUMN IF NOT EXISTS administrative_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS section child_section,
ADD COLUMN IF NOT EXISTS group_id UUID;

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  section child_section NOT NULL,
  type group_type NOT NULL DEFAULT 'mixed_group',
  age_min_months INTEGER,
  age_max_months INTEGER,
  capacity INTEGER DEFAULT 15,
  assigned_educator_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical_records table for detailed medical tracking
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  record_type TEXT NOT NULL, -- 'vaccination', 'treatment', 'incident', 'checkup'
  date DATE NOT NULL,
  description TEXT NOT NULL,
  doctor_name TEXT,
  doctor_contact TEXT,
  documents JSONB DEFAULT '[]',
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create authorized_persons table for pickup authorization
CREATE TABLE IF NOT EXISTS public.authorized_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  is_emergency_contact BOOLEAN DEFAULT false,
  is_pickup_authorized BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generate QR codes for existing children using a temporary sequence
DO $$
DECLARE
  child_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR child_record IN 
    SELECT id FROM public.children WHERE code_qr_id IS NULL ORDER BY created_at
  LOOP
    UPDATE public.children 
    SET code_qr_id = 'LPRDS-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = child_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Add foreign key constraints
ALTER TABLE public.children 
ADD CONSTRAINT fk_children_group 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.groups 
ADD CONSTRAINT fk_groups_educator 
FOREIGN KEY (assigned_educator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.medical_records 
ADD CONSTRAINT fk_medical_records_child 
FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

ALTER TABLE public.medical_records 
ADD CONSTRAINT fk_medical_records_recorder 
FOREIGN KEY (recorded_by) REFERENCES public.profiles(id);

ALTER TABLE public.authorized_persons 
ADD CONSTRAINT fk_authorized_persons_child 
FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_persons ENABLE ROW LEVEL SECURITY;

-- RLS policies for groups
CREATE POLICY "Admins and secretaries can manage all groups" 
ON public.groups 
FOR ALL 
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can view their assigned groups" 
ON public.groups 
FOR SELECT 
USING (assigned_educator_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for medical records
CREATE POLICY "Admins and secretaries can manage all medical records" 
ON public.medical_records 
FOR ALL 
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can manage medical records for their children" 
ON public.medical_records 
FOR ALL 
USING (child_id IN (SELECT get_educator_children(auth.uid())));

CREATE POLICY "Parents can view their children's medical records" 
ON public.medical_records 
FOR SELECT 
USING (child_id IN (SELECT get_parent_children(auth.uid())));

-- RLS policies for authorized persons
CREATE POLICY "Admins and secretaries can manage all authorized persons" 
ON public.authorized_persons 
FOR ALL 
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can view authorized persons for their children" 
ON public.authorized_persons 
FOR SELECT 
USING (child_id IN (SELECT get_educator_children(auth.uid())));

CREATE POLICY "Parents can view authorized persons for their children" 
ON public.authorized_persons 
FOR SELECT 
USING (child_id IN (SELECT get_parent_children(auth.uid())));

-- Create updated_at triggers
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_authorized_persons_updated_at
BEFORE UPDATE ON public.authorized_persons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-generate QR codes
CREATE OR REPLACE FUNCTION public.generate_child_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code_qr_id IS NULL THEN
    NEW.code_qr_id := 'LPRDS-' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(code_qr_id FROM 7) AS INTEGER)), 0) + 1
      FROM public.children 
      WHERE code_qr_id IS NOT NULL
    )::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_qr_code
BEFORE INSERT ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.generate_child_qr_code();
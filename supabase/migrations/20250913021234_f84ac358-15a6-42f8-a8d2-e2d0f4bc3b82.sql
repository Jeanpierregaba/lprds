-- Create daily reports table for crèche/garderie
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  educator_id UUID NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIME,
  departure_time TIME,
  health_status TEXT CHECK (health_status IN ('bien', 'surveiller', 'malade')),
  health_notes TEXT,
  activities JSONB DEFAULT '[]'::JSONB,
  nap_taken BOOLEAN DEFAULT FALSE,
  nap_duration_minutes INTEGER,
  breakfast_eaten TEXT CHECK (breakfast_eaten IN ('bien_mange', 'peu_mange', 'rien_mange')),
  lunch_eaten TEXT CHECK (lunch_eaten IN ('bien_mange', 'peu_mange', 'rien_mange')),
  snack_eaten TEXT CHECK (snack_eaten IN ('bien_mange', 'peu_mange', 'rien_mange')),
  hygiene_bath BOOLEAN DEFAULT FALSE,
  hygiene_bowel_movement BOOLEAN DEFAULT FALSE,
  hygiene_frequency_notes TEXT,
  mood TEXT CHECK (mood IN ('joyeux', 'calme', 'agite', 'triste', 'fatigue')),
  special_observations TEXT,
  photos JSONB DEFAULT '[]'::JSONB,
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, report_date)
);

-- Create daily attendance table for all sections
CREATE TABLE public.daily_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  educator_id UUID NOT NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIME,
  arrival_scanned_by UUID,
  departure_time TIME,
  departure_scanned_by UUID,
  is_present BOOLEAN DEFAULT TRUE,
  absence_reason TEXT,
  absence_notified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, attendance_date)
);

-- Create QR scan logs table for security tracking
CREATE TABLE public.qr_scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  scanned_by UUID NOT NULL,
  scan_type TEXT CHECK (scan_type IN ('arrival', 'departure')) NOT NULL,
  scan_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_reports
CREATE POLICY "Admins and secretaries can manage all daily reports"
ON public.daily_reports
FOR ALL
TO authenticated
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can manage reports for their children"
ON public.daily_reports
FOR ALL
TO authenticated
USING (child_id IN (SELECT get_educator_children(auth.uid())));

CREATE POLICY "Parents can view validated reports for their children"
ON public.daily_reports
FOR SELECT
TO authenticated
USING (
  is_validated = TRUE 
  AND child_id IN (SELECT get_parent_children(auth.uid()))
);

-- RLS Policies for daily_attendance
CREATE POLICY "Admins and secretaries can manage all attendance"
ON public.daily_attendance
FOR ALL
TO authenticated
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can manage attendance for their children"
ON public.daily_attendance
FOR ALL
TO authenticated
USING (child_id IN (SELECT get_educator_children(auth.uid())));

CREATE POLICY "Parents can view attendance for their children"
ON public.daily_attendance
FOR SELECT
TO authenticated
USING (child_id IN (SELECT get_parent_children(auth.uid())));

-- RLS Policies for qr_scan_logs
CREATE POLICY "Admins and secretaries can view all scan logs"
ON public.qr_scan_logs
FOR SELECT
TO authenticated
USING (is_admin_or_secretary(auth.uid()));

CREATE POLICY "Users can create scan logs"
ON public.qr_scan_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Educators can view scan logs for their children"
ON public.qr_scan_logs
FOR SELECT
TO authenticated
USING (child_id IN (SELECT get_educator_children(auth.uid())));

-- Create triggers for updated_at
CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_attendance_updated_at
  BEFORE UPDATE ON public.daily_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for daily report photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily-reports', 'daily-reports', false);

-- Storage policies for daily report photos
CREATE POLICY "Educators can upload photos for their children"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'daily-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view photos for authorized children"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'daily-reports'
  AND (
    -- Admins can see all
    is_admin_or_secretary(auth.uid())
    OR
    -- Educators can see photos for their children
    (storage.foldername(name))[2]::uuid IN (SELECT get_educator_children(auth.uid()))
    OR
    -- Parents can see photos for their children
    (storage.foldername(name))[2]::uuid IN (SELECT get_parent_children(auth.uid()))
  )
);
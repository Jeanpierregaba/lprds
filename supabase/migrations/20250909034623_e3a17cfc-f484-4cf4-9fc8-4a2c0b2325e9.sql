-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'secretary', 'educator', 'parent');

-- Create enum for child status  
CREATE TYPE public.child_status AS ENUM ('active', 'inactive', 'waiting_list');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  role user_role NOT NULL DEFAULT 'parent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  admission_date DATE NOT NULL,
  status child_status NOT NULL DEFAULT 'active',
  medical_info TEXT,
  allergies TEXT,
  special_needs TEXT,
  emergency_contacts JSONB,
  assigned_educator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parent_children relationship table
CREATE TABLE public.parent_children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, date)
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  photos JSONB,
  educator_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  child_id UUID REFERENCES public.children(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create login history table
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to check if user is admin or secretary
CREATE OR REPLACE FUNCTION public.is_admin_or_secretary(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'secretary')
  );
$$;

-- Create function to check if user is educator
CREATE OR REPLACE FUNCTION public.is_educator(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role = 'educator'
  );
$$;

-- Create function to get user's assigned children (for educators)
CREATE OR REPLACE FUNCTION public.get_educator_children(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id FROM public.children c
  JOIN public.profiles p ON c.assigned_educator_id = p.id
  WHERE p.user_id = user_uuid;
$$;

-- Create function to get user's own children (for parents)
CREATE OR REPLACE FUNCTION public.get_parent_children(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.child_id FROM public.parent_children pc
  JOIN public.profiles p ON pc.parent_id = p.id
  WHERE p.user_id = user_uuid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins and secretaries can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin_or_secretary(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for children
CREATE POLICY "Admins and secretaries can view all children"
ON public.children FOR SELECT
USING (public.is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can view their assigned children"
ON public.children FOR SELECT
USING (id = ANY(SELECT public.get_educator_children(auth.uid())));

CREATE POLICY "Parents can view their own children"
ON public.children FOR SELECT
USING (id = ANY(SELECT public.get_parent_children(auth.uid())));

CREATE POLICY "Admins and secretaries can manage children"
ON public.children FOR ALL
USING (public.is_admin_or_secretary(auth.uid()));

-- RLS Policies for parent_children
CREATE POLICY "Admins and secretaries can view all parent-child relationships"
ON public.parent_children FOR SELECT
USING (public.is_admin_or_secretary(auth.uid()));

CREATE POLICY "Parents can view their own relationships"
ON public.parent_children FOR SELECT
USING (parent_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage parent-child relationships"
ON public.parent_children FOR ALL
USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for attendance
CREATE POLICY "Admins and secretaries can view all attendance"
ON public.attendance FOR SELECT
USING (public.is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can view attendance for their children"
ON public.attendance FOR SELECT
USING (child_id = ANY(SELECT public.get_educator_children(auth.uid())));

CREATE POLICY "Parents can view their children's attendance"
ON public.attendance FOR SELECT
USING (child_id = ANY(SELECT public.get_parent_children(auth.uid())));

CREATE POLICY "Educators can manage attendance for their children"
ON public.attendance FOR ALL
USING (child_id = ANY(SELECT public.get_educator_children(auth.uid())));

CREATE POLICY "Admins and secretaries can manage all attendance"
ON public.attendance FOR ALL
USING (public.is_admin_or_secretary(auth.uid()));

-- RLS Policies for activities
CREATE POLICY "Admins and secretaries can view all activities"
ON public.activities FOR SELECT
USING (public.is_admin_or_secretary(auth.uid()));

CREATE POLICY "Educators can view activities for their children"
ON public.activities FOR SELECT
USING (child_id = ANY(SELECT public.get_educator_children(auth.uid())));

CREATE POLICY "Parents can view their children's activities"
ON public.activities FOR SELECT
USING (child_id = ANY(SELECT public.get_parent_children(auth.uid())));

CREATE POLICY "Educators can manage activities for their children"
ON public.activities FOR ALL
USING (child_id = ANY(SELECT public.get_educator_children(auth.uid())));

CREATE POLICY "Admins and secretaries can manage all activities"
ON public.activities FOR ALL
USING (public.is_admin_or_secretary(auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Users can view messages sent to them or sent by them"
ON public.messages FOR SELECT
USING (
  sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  recipient_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update messages they received (mark as read)"
ON public.messages FOR UPDATE
USING (recipient_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for login_history
CREATE POLICY "Users can view their own login history"
ON public.login_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history"
ON public.login_history FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert login history"
ON public.login_history FOR INSERT
WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'parent')
  );
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create message_signatures table for broadcast message acknowledgments
CREATE TABLE IF NOT EXISTS public.message_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, parent_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_signatures_message_id ON public.message_signatures(message_id);
CREATE INDEX IF NOT EXISTS idx_message_signatures_parent_id ON public.message_signatures(parent_id);

-- Enable RLS
ALTER TABLE public.message_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_signatures
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Parents can view their own signatures" ON public.message_signatures;
DROP POLICY IF EXISTS "Parents can sign messages" ON public.message_signatures;
DROP POLICY IF EXISTS "Admins can view all signatures" ON public.message_signatures;

-- Parents can view their own signatures
CREATE POLICY "Parents can view their own signatures"
ON public.message_signatures FOR SELECT
USING (parent_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Parents can insert their own signatures
CREATE POLICY "Parents can sign messages"
ON public.message_signatures FOR INSERT
WITH CHECK (parent_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Admins and secretaries can view all signatures
CREATE POLICY "Admins can view all signatures"
ON public.message_signatures FOR SELECT
USING (public.is_admin_or_secretary(auth.uid()));


-- WhatsApp notifications support (provider-agnostic)

-- 1) App settings (for runtime-switchable provider)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Notification logs (idempotence + traceability)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  notification_type TEXT NOT NULL,
  entity_table TEXT NULL,
  entity_id UUID NULL,
  recipient_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed')) DEFAULT 'queued',
  provider TEXT NULL,
  provider_message_id TEXT NULL,
  request_payload JSONB NULL,
  response_payload JSONB NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel, notification_type, entity_table, entity_id, recipient_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_created_at
  ON public.notification_logs(recipient_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_entity
  ON public.notification_logs(entity_table, entity_id);

-- 3) Parent WhatsApp preferences + contact
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT NULL;

-- Seed default provider
INSERT INTO public.app_settings(key, value)
VALUES ('whatsapp_provider', '{"provider":"twilio"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

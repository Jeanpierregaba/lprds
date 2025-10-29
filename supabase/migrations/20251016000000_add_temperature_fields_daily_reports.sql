-- Ajouter les colonnes de température à la table daily_reports
ALTER TABLE public.daily_reports
ADD COLUMN IF NOT EXISTS temperature_arrival NUMERIC(4,1),
ADD COLUMN IF NOT EXISTS temperature_departure NUMERIC(4,1);

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN public.daily_reports.temperature_arrival IS 'Température de l''enfant prise à son arrivée (en degrés Celsius)';
COMMENT ON COLUMN public.daily_reports.temperature_departure IS 'Température de l''enfant prise à son départ (en degrés Celsius)';


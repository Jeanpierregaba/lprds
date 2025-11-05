-- Add new fields to daily_attendance table for tracking who brought/picked up the child and temperature
ALTER TABLE public.daily_attendance
ADD COLUMN brought_by TEXT,
ADD COLUMN picked_up_by TEXT,
ADD COLUMN arrival_temperature NUMERIC(4,1),
ADD COLUMN departure_temperature NUMERIC(4,1);

COMMENT ON COLUMN public.daily_attendance.brought_by IS 'Personne qui a amené l''enfant';
COMMENT ON COLUMN public.daily_attendance.picked_up_by IS 'Personne qui a récupéré l''enfant';
COMMENT ON COLUMN public.daily_attendance.arrival_temperature IS 'Température de l''enfant à l''arrivée en °C';
COMMENT ON COLUMN public.daily_attendance.departure_temperature IS 'Température de l''enfant au départ en °C';
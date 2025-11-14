-- Change mood field from TEXT to JSONB array with validation
BEGIN;

-- Add temporary JSONB column with default empty array
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS mood_tmp jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Normalize existing mood values (including legacy english values) into arrays
WITH converted AS (
  SELECT
    id,
    CASE
      WHEN mood IS NULL OR btrim(mood::text) = '' THEN '[]'::jsonb
      WHEN mood::text LIKE '[%' THEN (
        SELECT COALESCE(jsonb_agg(
          CASE arr_elem
            WHEN 'happy' THEN 'joyeux'
            WHEN 'calm' THEN 'calme'
            WHEN 'agitated' THEN 'agite'
            WHEN 'sad' THEN 'triste'
            WHEN 'tired' THEN 'fatigue'
            ELSE arr_elem
          END
        ), '[]'::jsonb)
        FROM jsonb_array_elements_text(mood::jsonb) AS t(arr_elem)
      )
      ELSE jsonb_build_array(
        CASE mood::text
          WHEN 'happy' THEN 'joyeux'
          WHEN 'calm' THEN 'calme'
          WHEN 'agitated' THEN 'agite'
          WHEN 'sad' THEN 'triste'
          WHEN 'tired' THEN 'fatigue'
          ELSE mood::text
        END
      )
    END AS new_mood
  FROM public.daily_reports
)
UPDATE public.daily_reports dr
SET mood_tmp = converted.new_mood
FROM converted
WHERE dr.id = converted.id;

-- Replace old column with JSONB version
ALTER TABLE public.daily_reports
  DROP COLUMN mood;

ALTER TABLE public.daily_reports
  RENAME COLUMN mood_tmp TO mood;

ALTER TABLE public.daily_reports
  ALTER COLUMN mood SET DEFAULT '[]'::jsonb;

-- Ensure all mood values are valid arrays containing allowed entries
ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_mood_valid_values CHECK (
    jsonb_typeof(mood) = 'array'
    AND (
      mood = '[]'::jsonb OR
      (
        jsonb_array_length(mood - 'joyeux' - 'calme' - 'agite' - 'triste' - 'fatigue') = 0
      )
    )
  );

COMMIT;

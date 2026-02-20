-- Fix the mood check constraint to include all valid moods
-- This removes the old constraint and creates a new one with all valid values

-- First, drop the existing constraint
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_mood_valid_values;

-- Then create a new constraint with all valid moods including "grincheux"
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_mood_valid_values 
CHECK (
  mood IS NULL OR 
  (
    jsonb_typeof(mood) = 'array' AND 
    mood <@ '["joyeux", "calme", "agite", "triste", "fatigue", "grincheux"]'::jsonb
  )
);

-- Also fix any existing invalid mood values
UPDATE daily_reports 
SET mood = '["joyeux"]' 
WHERE mood IS NOT NULL 
  AND (
    jsonb_typeof(mood) != 'array' OR 
    NOT mood <@ '["joyeux", "calme", "agite", "triste", "fatigue", "grincheux"]'::jsonb
  );

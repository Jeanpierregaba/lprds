-- Add new JSONB fields to weekly_reports table for structured form data
ALTER TABLE public.weekly_reports
ADD COLUMN IF NOT EXISTS activities_learning JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS behavior_attitude JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS social_relations JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS emotion_management JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS meals TEXT,
ADD COLUMN IF NOT EXISTS teacher_observations TEXT,
ADD COLUMN IF NOT EXISTS media_files JSONB DEFAULT '[]'::JSONB;

-- Keep content field for backward compatibility but make it nullable
ALTER TABLE public.weekly_reports
ALTER COLUMN content DROP NOT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.weekly_reports.activities_learning IS 'JSON object with 6 domain keys: langage_oral_ecrit, activites_physiques, activites_artistiques, outils_mathematiques, explorer_monde, anglais';
COMMENT ON COLUMN public.weekly_reports.behavior_attitude IS 'JSON array of selected behaviors: calme, joyeux, souriant, participatif, reserve, dynamique, agite, fatigue, emotif';
COMMENT ON COLUMN public.weekly_reports.social_relations IS 'JSON array of selected relations: gentil_camarades, sociable, cooperatif, mal_partager, jouer_seul';
COMMENT ON COLUMN public.weekly_reports.emotion_management IS 'JSON array of selected emotions: peu_pleure, beaucoup_pleure, besoin_rasseure, exprime_mieux, en_progres, autonome';
COMMENT ON COLUMN public.weekly_reports.meals IS 'Single choice: bien_mange, peu_mange, rien_mange';
COMMENT ON COLUMN public.weekly_reports.media_files IS 'JSON array of media file URLs (photos/videos)';

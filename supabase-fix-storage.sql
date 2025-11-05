-- ============================================
-- FIX STORAGE POLICIES - Bucket daily-reports
-- ============================================

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-reports', 'daily-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- 3. Créer les nouvelles policies
-- Policy pour l'upload (INSERT)
CREATE POLICY "Allow authenticated users to upload daily reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'daily-reports');

-- Policy pour la lecture (SELECT)
CREATE POLICY "Allow public read access to daily reports"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'daily-reports');

-- Policy pour la mise à jour (UPDATE)
CREATE POLICY "Allow authenticated users to update daily reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'daily-reports');

-- Policy pour la suppression (DELETE)
CREATE POLICY "Allow authenticated users to delete daily reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'daily-reports');

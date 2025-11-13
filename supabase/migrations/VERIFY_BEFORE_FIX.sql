-- Script de vérification à exécuter AVANT d'appliquer la migration
-- Pour diagnostiquer le problème d'accès des éducateurs aux données d'attendance

-- 1. Vérifier que la fonction is_educator existe
SELECT 
  'is_educator function' as check_name,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' 
      AND p.proname = 'is_educator'
    ) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- 2. Vérifier les politiques actuelles sur daily_attendance
SELECT 
  'daily_attendance policies' as check_name,
  policyname as policy_name,
  cmd as command,
  qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'daily_attendance'
ORDER BY policyname;

-- 3. Vérifier que la table daily_attendance existe et a RLS activé
SELECT 
  'daily_attendance RLS' as check_name,
  CASE 
    WHEN relrowsecurity 
    THEN '✅ RLS ENABLED' 
    ELSE '❌ RLS DISABLED' 
  END as status
FROM pg_class 
WHERE relname = 'daily_attendance' 
AND relnamespace = 'public'::regnamespace;

-- 4. Compter les enfants actifs
SELECT 
  'active children count' as check_name,
  COUNT(*) as count,
  '✅ ' || COUNT(*) || ' enfants actifs' as status
FROM public.children 
WHERE status = 'active';

-- 5. Vérifier qu'il y a des enregistrements d'attendance
SELECT 
  'attendance records count' as check_name,
  COUNT(*) as count,
  '✅ ' || COUNT(*) || ' enregistrements' as status
FROM public.daily_attendance;

-- 6. Vérifier les éducateurs dans le système
SELECT 
  'educators count' as check_name,
  COUNT(*) as count,
  '✅ ' || COUNT(*) || ' éducateurs' as status
FROM public.profiles 
WHERE role = 'educator';

-- 7. Test de la fonction is_educator (remplacez UUID_EDUCATRICE par un vrai UUID)
-- Exemple: SELECT public.is_educator('12345678-1234-1234-1234-123456789abc'::uuid);
SELECT 
  'Test function' as info,
  'Remplacez UUID_EDUCATRICE ci-dessous par un UUID réel pour tester' as instruction;

-- 8. Afficher les politiques des tables connexes pour comparaison
SELECT 
  'Comparison with daily_reports' as check_name,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('daily_reports', 'children')
AND policyname LIKE '%Educator%'
ORDER BY tablename, policyname;

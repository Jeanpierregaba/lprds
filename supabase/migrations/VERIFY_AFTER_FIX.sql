-- Script de vérification à exécuter APRÈS l'application de la migration
-- Pour confirmer que les éducateurs ont maintenant accès aux données d'attendance

-- 1. Vérifier que l'ancienne politique a été supprimée
SELECT 
  'Old policy removed' as check_name,
  CASE 
    WHEN NOT EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'daily_attendance'
      AND policyname = 'Educators can manage attendance for their children'
    )
    THEN '✅ REMOVED (correct)' 
    ELSE '❌ STILL EXISTS (problem)' 
  END as status;

-- 2. Vérifier que les nouvelles politiques ont été créées
SELECT 
  'New policies created' as check_name,
  COUNT(*) as policies_count,
  CASE 
    WHEN COUNT(*) >= 2 
    THEN '✅ ' || COUNT(*) || ' nouvelles politiques créées' 
    ELSE '❌ Politiques manquantes' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'daily_attendance'
AND policyname LIKE '%all active children%';

-- 3. Lister toutes les politiques sur daily_attendance
SELECT 
  'All current policies' as section,
  policyname as policy_name,
  cmd as command,
  CASE 
    WHEN cmd = 'ALL' THEN '✅ SELECT/UPDATE/DELETE'
    WHEN cmd = 'INSERT' THEN '✅ INSERT'
    WHEN cmd = 'SELECT' THEN '✅ SELECT'
    ELSE cmd
  END as operations
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'daily_attendance'
ORDER BY policyname;

-- 4. Vérifier la cohérence avec les autres tables
SELECT 
  'Policy alignment check' as check_name,
  tablename,
  COUNT(*) as educator_policies_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('children', 'daily_reports', 'daily_attendance')
AND policyname ILIKE '%educator%'
AND policyname ILIKE '%active%'
GROUP BY tablename
ORDER BY tablename;

-- 5. Comparer les définitions des politiques
SELECT 
  'Policy definitions comparison' as section,
  tablename,
  policyname,
  CASE 
    WHEN qual ILIKE '%is_educator%' AND qual ILIKE '%active%' 
    THEN '✅ Uses is_educator + active check'
    WHEN qual ILIKE '%is_educator%' 
    THEN '⚠️ Uses is_educator only'
    WHEN qual ILIKE '%get_educator_children%' 
    THEN '❌ Uses old get_educator_children'
    ELSE '❓ Other condition'
  END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('children', 'daily_reports', 'daily_attendance')
AND policyname ILIKE '%educator%'
ORDER BY tablename, policyname;

-- 6. Test de permissions (informationnel)
SELECT 
  '=== NEXT STEPS ===' as section,
  'Reconnectez-vous avec un compte éducatrice' as step_1,
  'Testez la création d''un rapport quotidien' as step_2,
  'Vérifiez que les heures et températures se chargent automatiquement' as step_3;

-- 7. Afficher un résumé final
SELECT 
  'Migration status' as check_name,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'daily_attendance'
      AND policyname = 'Educators can manage attendance for all active children'
    )
    AND EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'daily_attendance'
      AND policyname = 'Educators can insert attendance for all active children'
    )
    AND NOT EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'daily_attendance'
      AND policyname = 'Educators can manage attendance for their children'
    )
    THEN '✅ MIGRATION SUCCESSFUL' 
    ELSE '❌ MIGRATION INCOMPLETE - Check logs' 
  END as status;

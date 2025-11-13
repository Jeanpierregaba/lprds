# 🚀 Guide Rapide - Correction Bug Éducatrices

## ⚡ Problème
Les éducatrices ne peuvent pas charger les heures et températures depuis le pointage QR sur mobile/tablette lors du remplissage du formulaire de suivi quotidien.

## ✅ Solution en 3 étapes

### Étape 1: Aller sur Supabase
1. Ouvrez https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"** dans le menu

### Étape 2: Exécuter la migration
1. Cliquez sur **"New query"**
2. Copiez-collez ce code SQL :

```sql
-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Educators can manage attendance for their children" ON public.daily_attendance;

-- Créer la nouvelle politique pour tous les enfants actifs
CREATE POLICY "Educators can manage attendance for all active children"
ON public.daily_attendance
FOR ALL
TO authenticated
USING (
  public.is_educator(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = daily_attendance.child_id 
    AND c.status = 'active'
  )
);

-- Créer la politique d'insertion
CREATE POLICY "Educators can insert attendance for all active children"
ON public.daily_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_educator(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.children c 
    WHERE c.id = daily_attendance.child_id 
    AND c.status = 'active'
  )
);
```

3. Cliquez sur **"Run"** (ou `Ctrl+Enter`)
4. Vérifiez le message de succès

### Étape 3: Tester
1. Déconnectez-vous du compte éducatrice
2. Reconnectez-vous
3. Testez la création d'un rapport sur mobile/tablette
4. Vérifiez que les heures et températures s'affichent maintenant ✅

---

## 📚 Documentation complète
- **Guide détaillé**: `FIX_EDUCATORS_ATTENDANCE_ACCESS.md`
- **Migration**: `supabase/migrations/20251113000000_fix_educators_daily_attendance_access.sql`
- **Vérification avant**: `supabase/migrations/VERIFY_BEFORE_FIX.sql`
- **Vérification après**: `supabase/migrations/VERIFY_AFTER_FIX.sql`

---

## ❓ Besoin d'aide ?
Si ça ne fonctionne toujours pas après la migration :
1. Vérifiez les logs de la console navigateur (F12)
2. Exécutez le script `VERIFY_AFTER_FIX.sql`
3. Contactez le support technique

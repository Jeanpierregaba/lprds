# 🔧 Correction: Accès aux données d'attendance pour les éducatrices

## 📋 Problème identifié

Les éducatrices ne peuvent pas charger les **heures d'arrivée/départ** et les **températures** depuis le pointage QR lors du remplissage du formulaire de suivi quotidien sur mobile et tablette, alors que les administrateurs le peuvent.

### Cause racine

Les **politiques RLS (Row Level Security)** de la table `daily_attendance` limitent l'accès des éducatrices uniquement aux enfants **directement assignés à leur groupe** via la fonction `get_educator_children()`, alors que :

- ✅ La table `children` permet déjà l'accès à tous les enfants actifs (migration du 15 oct 2025)
- ✅ La table `daily_reports` permet déjà l'accès à tous les enfants actifs (migration du 15 oct 2025)
- ❌ La table `daily_attendance` reste restrictive (pas encore mise à jour)

---

## 🚀 Solution

### Migration SQL créée

**Fichier**: `supabase/migrations/20251113000000_fix_educators_daily_attendance_access.sql`

Cette migration :
1. Supprime l'ancienne politique restrictive pour les éducateurs
2. Crée une nouvelle politique permettant l'accès à **tous les enfants actifs**
3. Aligne les permissions avec celles des tables `children` et `daily_reports`

---

## 📝 Instructions d'application

### Option 1: Via le tableau de bord Supabase (Recommandé)

1. **Connectez-vous** à votre projet Supabase : https://supabase.com/dashboard

2. **Naviguez vers** : `SQL Editor` dans le menu de gauche

3. **Créez une nouvelle requête** : Cliquez sur "New query"

4. **Copiez-collez** le SQL suivant :

```sql
-- Migration pour permettre aux éducateurs d'accéder aux données d'attendance de tous les enfants actifs
-- Cela corrige le bug où les éducateurs ne peuvent pas charger les heures et températures
-- depuis le pointage QR lors du remplissage du formulaire de suivi quotidien

-- Supprimer l'ancienne politique restrictive pour les éducateurs sur daily_attendance
DROP POLICY IF EXISTS "Educators can manage attendance for their children" ON public.daily_attendance;

-- Créer une nouvelle politique pour SELECT/UPDATE/DELETE permettant aux éducateurs 
-- d'accéder aux données d'attendance de tous les enfants actifs
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

-- Créer une politique pour INSERT permettant aux éducateurs 
-- de créer des enregistrements d'attendance pour tous les enfants actifs
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

5. **Exécutez la requête** : Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`

6. **Vérifiez le succès** : Vous devriez voir "Success. No rows returned"

---

### Option 2: Via Supabase CLI (Si disponible)

```bash
# Naviguer vers le dossier du projet
cd c:\Users\jeanp\lprds

# Appliquer la migration
supabase db push
```

---

## ✅ Vérification

Après l'application de la migration :

1. **Déconnectez-vous** de votre compte éducatrice
2. **Reconnectez-vous** pour rafraîchir les permissions
3. **Testez** la création d'un rapport quotidien sur mobile/tablette
4. **Vérifiez** que les heures et températures se chargent automatiquement

### Test à effectuer

1. Ouvrez l'application en tant qu'éducatrice sur mobile ou tablette
2. Allez dans "Rapports quotidiens" → "Créer un rapport"
3. Sélectionnez un enfant qui a déjà un pointage QR aujourd'hui
4. **Vérifiez** que l'alerte verte s'affiche avec le message :
   > "Les horaires et températures ont été chargés automatiquement depuis le pointage QR de l'enfant."
5. **Confirmez** que les champs suivants sont pré-remplis avec un fond vert :
   - Heure d'arrivée
   - Heure de départ (si l'enfant est déjà parti)
   - Température à l'arrivée
   - Température au départ (si disponible)

---

## 🔍 Détails techniques

### Avant la migration

```sql
-- Politique restrictive (PROBLÈME)
CREATE POLICY "Educators can manage attendance for their children"
ON public.daily_attendance
FOR ALL
TO authenticated
USING (child_id IN (SELECT get_educator_children(auth.uid())));
-- ❌ Ne retourne que les enfants assignés au groupe de l'éducatrice
```

### Après la migration

```sql
-- Politique permissive (SOLUTION)
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
-- ✅ Permet l'accès à tous les enfants actifs
```

---

## 📊 Impact

### Tables concernées

| Table | Statut avant | Statut après |
|-------|--------------|--------------|
| `children` | ✅ Tous les enfants actifs | ✅ Pas de changement |
| `daily_reports` | ✅ Tous les enfants actifs | ✅ Pas de changement |
| `daily_attendance` | ❌ Uniquement groupe assigné | ✅ **Tous les enfants actifs** |

### Utilisateurs impactés

- ✅ **Éducatrices** : Peuvent maintenant charger les données d'attendance pour tous les enfants
- ✅ **Administrateurs** : Aucun changement (accès complet maintenu)
- ✅ **Parents** : Aucun changement (lecture seule de leurs enfants)

---

## 🛡️ Sécurité

La migration maintient la sécurité :
- Les éducatrices accèdent **uniquement** aux enfants avec `status = 'active'`
- Les parents ne voient **que** leurs propres enfants
- Les administrateurs conservent leur accès complet
- L'authentification reste obligatoire (`TO authenticated`)

---

## 📞 Support

Si vous rencontrez des problèmes après l'application de la migration :

1. Vérifiez que la fonction `is_educator()` existe dans votre base de données
2. Vérifiez les logs Supabase pour les erreurs RLS
3. Testez avec un compte éducatrice différent
4. Vérifiez que les enfants ont bien `status = 'active'`

---

**Date de création** : 13 novembre 2025  
**Version** : 1.0  
**Priorité** : 🔴 Haute (Bug bloquant pour les éducatrices)

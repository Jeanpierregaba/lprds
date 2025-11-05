# 🔧 Correction des Erreurs d'Upload d'Images

## ❌ Problèmes Identifiés

### 1. **Storage Policy Error**
```
StorageApiError: new row violates row-level security policy
```
**Cause** : Les policies de sécurité (RLS) ne sont pas configurées pour le bucket `daily-reports`

### 2. **Duplicate Key Error**
```
duplicate key value violates unique constraint "daily_reports_child_id_report_date_key"
```
**Cause** : Tentative de créer un nouveau rapport alors qu'un rapport existe déjà pour cet enfant à cette date

---

## ✅ Solutions Appliquées

### Solution 1 : Configurer les Storage Policies

**Fichier créé** : `supabase-fix-storage.sql`

**Action requise** :
1. Allez sur votre **Dashboard Supabase**
2. Cliquez sur **SQL Editor** (menu de gauche)
3. Copiez-collez le contenu du fichier `supabase-fix-storage.sql`
4. Cliquez sur **Run**

**Ou manuellement** :

1. Allez dans **Storage** → **Policies**
2. Sélectionnez le bucket `daily-reports`
3. Cliquez sur **"New Policy"**
4. Choisissez le template **"Allow authenticated uploads"**
5. Ajoutez également une policy pour la lecture publique

### Solution 2 : Gérer les Rapports Dupliqués

**Modification** : `src/components/admin/reports/DailyReportForm.tsx`

**Changement** :
- Avant de créer un nouveau rapport, le système vérifie maintenant si un rapport existe déjà
- Si un rapport existe, il le met à jour au lieu de créer un doublon
- Évite l'erreur de contrainte unique

**Code ajouté** :
```typescript
// Vérifier si un rapport existe déjà pour cet enfant à cette date
const { data: existingReportCheck } = await supabase
  .from('daily_reports')
  .select('id')
  .eq('child_id', child.id)
  .eq('report_date', formData.report_date)
  .maybeSingle();

if (existingReportCheck) {
  // Un rapport existe déjà, le mettre à jour
  const { error } = await supabase
    .from('daily_reports')
    .update(reportData)
    .eq('id', existingReportCheck.id);
  // ...
}
```

---

## 🚀 Étapes de Déploiement

### Étape 1 : Configurer Supabase Storage

1. **Ouvrez votre Dashboard Supabase**
2. **SQL Editor** → Copiez le contenu de `supabase-fix-storage.sql`
3. **Run** pour exécuter le script

### Étape 2 : Vérifier le Bucket

1. **Storage** → Vérifiez que `daily-reports` existe
2. Le bucket doit être **Public**
3. **Policies** → Vérifiez que 4 policies sont créées :
   - Allow authenticated users to upload daily reports
   - Allow public read access to daily reports
   - Allow authenticated users to update daily reports
   - Allow authenticated users to delete daily reports

### Étape 3 : Tester l'Upload

1. Rechargez l'application (Ctrl + F5)
2. Créez un rapport quotidien
3. Ajoutez une image
4. Sauvegardez
5. ✅ L'upload devrait fonctionner !

---

## 🧪 Tests à Effectuer

### Test 1 : Upload d'Image
- [ ] Créer un nouveau rapport
- [ ] Ajouter une image (< 10 MB)
- [ ] Sauvegarder
- [ ] Vérifier que l'image est uploadée
- [ ] Vérifier dans Storage → daily-reports que le fichier existe

### Test 2 : Rapport Existant
- [ ] Créer un rapport pour un enfant (date du jour)
- [ ] Sauvegarder
- [ ] Créer un nouveau rapport pour le même enfant (même date)
- [ ] Sauvegarder
- [ ] ✅ Devrait mettre à jour le rapport existant (pas d'erreur)

### Test 3 : Multiples Images
- [ ] Créer un rapport
- [ ] Ajouter 3 images
- [ ] Sauvegarder
- [ ] Vérifier que les 3 images sont uploadées

### Test 4 : Modification de Rapport
- [ ] Ouvrir un rapport existant
- [ ] Ajouter une nouvelle image
- [ ] Sauvegarder
- [ ] Vérifier que l'ancienne et la nouvelle image sont présentes

---

## 📊 Structure des Données

### Bucket Storage : `daily-reports`

```
daily-reports/
├── {report_id_1}/
│   ├── 1699123456789_abc123.jpg
│   ├── 1699123457890_def456.png
│   └── ...
├── {report_id_2}/
│   └── ...
```

### Table : `daily_reports`

```sql
Contrainte unique :
UNIQUE (child_id, report_date)

Signification :
Un seul rapport par enfant par jour
```

---

## 🔍 Logs de Débogage

Les logs suivants s'affichent maintenant dans la console :

### Upload Réussi
```
Tentative d'upload: {report_id}/{timestamp}_{random}.jpg Taille: 123456 Type: image/jpeg
Upload réussi: {path: "...", id: "...", fullPath: "..."}
```

### Upload Échoué
```
Erreur détaillée upload: {message: "...", statusCode: 400}
Erreur upload photo: StorageApiError: ...
```

---

## 🔐 Sécurité

### Policies Configurées

1. **INSERT (Upload)** : Authentifié uniquement
   - Seuls les utilisateurs connectés peuvent uploader
   
2. **SELECT (Lecture)** : Public
   - Tout le monde peut voir les photos (parents)
   
3. **UPDATE** : Authentifié uniquement
   - Seuls les utilisateurs connectés peuvent modifier
   
4. **DELETE** : Authentifié uniquement
   - Seuls les utilisateurs connectés peuvent supprimer

### Validation des Fichiers

Le code valide :
- ✅ Type : Images uniquement (jpg, png, gif, webp)
- ✅ Taille : Maximum 10 MB par fichier
- ✅ Format : MIME type vérifié

---

## ⚠️ Erreurs Possibles

### "Bucket not found"
**Solution** : Exécutez le script SQL pour créer le bucket

### "Policy violation"
**Solution** : Exécutez le script SQL pour créer les policies

### "File too large"
**Solution** : Réduisez la taille de l'image ou augmentez la limite dans Settings → Storage

### "Invalid MIME type"
**Solution** : Assurez-vous que c'est bien une image (jpg, png, etc.)

---

## 📝 Checklist Finale

Avant de considérer le problème résolu :

- [ ] Script SQL exécuté dans Supabase
- [ ] Bucket `daily-reports` existe et est public
- [ ] 4 policies créées (INSERT, SELECT, UPDATE, DELETE)
- [ ] Application rechargée (Ctrl + F5)
- [ ] Test d'upload réussi
- [ ] Aucune erreur dans la console
- [ ] Images visibles dans Storage → daily-reports

---

**Date** : 5 novembre 2025  
**Problèmes** : Storage Policy + Duplicate Key  
**Statut** : ✅ Corrigé (en attente de configuration Supabase)

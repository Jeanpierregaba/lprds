# 📦 Configuration du Stockage Supabase - Bucket `daily-reports`

## ❌ Problème Actuel

Erreur lors de l'upload des images dans les rapports quotidiens.

## 🔍 Vérifications à Effectuer

### 1. Vérifier que le Bucket Existe

1. Connectez-vous à votre **Dashboard Supabase**
2. Allez dans **Storage** (menu de gauche)
3. Vérifiez qu'un bucket nommé **`daily-reports`** existe

**Si le bucket n'existe pas**, créez-le :
- Cliquez sur **"New bucket"**
- Nom : `daily-reports`
- Public : **OUI** (cochez "Public bucket")
- Cliquez sur **"Create bucket"**

### 2. Vérifier les Permissions (Policies)

Le bucket doit avoir des **Storage Policies** pour permettre l'upload et la lecture.

#### a) Policy pour l'Upload (INSERT)

```sql
-- Nom: Allow authenticated users to upload
-- Operation: INSERT
-- Policy:
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'daily-reports'
);
```

#### b) Policy pour la Lecture (SELECT)

```sql
-- Nom: Allow public read access
-- Operation: SELECT
-- Policy:
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'daily-reports'
);
```

#### c) Policy pour la Mise à Jour (UPDATE)

```sql
-- Nom: Allow authenticated users to update
-- Operation: UPDATE
-- Policy:
CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'daily-reports'
);
```

#### d) Policy pour la Suppression (DELETE)

```sql
-- Nom: Allow authenticated users to delete
-- Operation: DELETE
-- Policy:
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'daily-reports'
);
```

### 3. Configuration via l'Interface Supabase

**Étapes dans le Dashboard** :

1. Allez dans **Storage** → **Policies**
2. Sélectionnez le bucket **`daily-reports`**
3. Cliquez sur **"New Policy"**
4. Choisissez un template ou créez une policy personnalisée
5. Appliquez les policies ci-dessus

**OU utilisez le template "Allow authenticated uploads"** :
- Sélectionnez : **"Allow authenticated uploads"**
- Cela créera automatiquement les policies nécessaires

### 4. Vérifier la Taille Maximale des Fichiers

Par défaut, Supabase limite la taille des fichiers uploadés.

**Vérification** :
- Allez dans **Settings** → **Storage**
- Vérifiez **"Maximum file size"**
- Recommandé : **10 MB** minimum

### 5. Vérifier les CORS

Si l'erreur persiste, vérifiez la configuration CORS :

1. Allez dans **Settings** → **API**
2. Vérifiez que votre domaine est autorisé dans **"CORS"**
3. Pour le développement local, ajoutez : `http://localhost:8080`

## 🛠️ Configuration Rapide (SQL)

Si vous préférez tout configurer via SQL, exécutez ceci dans **SQL Editor** :

```sql
-- 1. Créer le bucket (si nécessaire)
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-reports', 'daily-reports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy pour l'upload
CREATE POLICY "Allow authenticated users to upload daily reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'daily-reports');

-- 3. Policy pour la lecture publique
CREATE POLICY "Allow public read access to daily reports"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'daily-reports');

-- 4. Policy pour la mise à jour
CREATE POLICY "Allow authenticated users to update daily reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'daily-reports');

-- 5. Policy pour la suppression
CREATE POLICY "Allow authenticated users to delete daily reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'daily-reports');
```

## 🧪 Test de l'Upload

Après la configuration, testez l'upload :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Créez un rapport quotidien
4. Ajoutez une image
5. Sauvegardez
6. Vérifiez les logs dans la console :
   - `Tentative d'upload: ...`
   - `Upload réussi: ...`

## 🔍 Messages d'Erreur Courants

### Erreur : "new row violates row-level security policy"
**Cause** : Policies manquantes ou incorrectes  
**Solution** : Ajoutez les policies ci-dessus

### Erreur : "Bucket not found"
**Cause** : Le bucket `daily-reports` n'existe pas  
**Solution** : Créez le bucket

### Erreur : "File size exceeds limit"
**Cause** : Fichier trop volumineux  
**Solution** : Réduisez la taille de l'image ou augmentez la limite

### Erreur : "Invalid MIME type"
**Cause** : Type de fichier non autorisé  
**Solution** : Vérifiez que c'est bien une image (jpg, png, etc.)

### Erreur : "CORS policy"
**Cause** : Domaine non autorisé  
**Solution** : Ajoutez votre domaine dans les paramètres CORS

## 📊 Structure des Fichiers Uploadés

Les fichiers sont organisés ainsi :

```
daily-reports/
├── {report_id_1}/
│   ├── 1699123456789_abc123.jpg
│   ├── 1699123457890_def456.png
│   └── ...
├── {report_id_2}/
│   ├── 1699123458901_ghi789.jpg
│   └── ...
└── ...
```

**Format du nom de fichier** :
```
{report_id}/{timestamp}_{random_id}.{extension}
```

Exemple :
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/1699123456789_x7k9m2.jpg
```

## 🔐 Sécurité

### Recommandations :

1. **Bucket Public** : OUI (pour que les parents puissent voir les photos)
2. **Upload** : Authentifié uniquement (seul le personnel peut uploader)
3. **Suppression** : Authentifié uniquement (seul le personnel peut supprimer)
4. **Taille max** : 10 MB par fichier
5. **Types autorisés** : Images uniquement (jpg, jpeg, png, gif, webp)

### Policy Avancée (Optionnelle)

Pour limiter l'upload aux seuls éducateurs et admins :

```sql
CREATE POLICY "Allow staff to upload daily reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'daily-reports' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'secretary', 'educator')
    AND profiles.is_active = true
  )
);
```

## 📝 Checklist de Vérification

Avant de tester, vérifiez :

- [ ] Le bucket `daily-reports` existe
- [ ] Le bucket est **public**
- [ ] Les policies INSERT, SELECT, UPDATE, DELETE sont créées
- [ ] La taille maximale est >= 10 MB
- [ ] CORS autorise `http://localhost:8080` (dev) et votre domaine (prod)
- [ ] Vous êtes connecté en tant qu'utilisateur authentifié
- [ ] L'utilisateur a le rôle approprié (admin, secretary, educator)

## 🆘 Débogage

Si l'erreur persiste après configuration :

1. **Ouvrez la console (F12)**
2. **Onglet Console** : Regardez les logs détaillés
3. **Onglet Network** : Vérifiez les requêtes vers Supabase
4. **Vérifiez le message d'erreur exact** dans le toast

Le message d'erreur détaillé devrait maintenant s'afficher dans le toast et la console.

---

**Date** : 5 novembre 2025  
**Bucket** : `daily-reports`  
**Type** : Public  
**Permissions** : Authenticated upload, Public read

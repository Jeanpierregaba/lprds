# Configuration Supabase - Étapes Exactes

## 🎯 Objectif
Permettre aux parents de recevoir un email d'activation et de définir leur mot de passe via `/reset-password`

## 📋 Checklist de Configuration

### ✅ Étape 1 : Configurer les URL de Redirection

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet : `bzksmrrlqjkhfgxevedl`
3. Allez dans **Authentication** → **URL Configuration**
4. Dans la section **Redirect URLs**, ajoutez ces URLs (une par ligne) :

```
http://localhost:5173/reset-password
http://localhost:5173/*
https://votre-domaine-production.com/reset-password
https://votre-domaine-production.com/*
```

5. Cliquez sur **Save**

### ✅ Étape 2 : Configurer la Confirmation d'Email

**Option A : Désactiver la confirmation (Recommandé pour usage interne)**

1. Allez dans **Authentication** → **Providers**
2. Cliquez sur **Email**
3. **Décochez** "Enable email confirmations"
4. Cliquez sur **Save**

**Avec cette option :**
- ✅ Le compte est immédiatement actif
- ✅ Le parent reçoit quand même l'email pour définir son mot de passe
- ✅ Pas besoin de cliquer sur un lien de confirmation séparé
- ⚠️ Moins sécurisé (mais OK pour usage interne)

**Option B : Garder la confirmation activée**

Si vous gardez la confirmation activée :
1. Le parent recevra un email "Confirm your signup"
2. Il devra cliquer sur le lien dans cet email
3. Il sera redirigé vers `/reset-password`
4. Il pourra définir son mot de passe

### ✅ Étape 3 : Vérifier les Templates d'Email

1. Allez dans **Authentication** → **Email Templates**

#### Template "Confirm signup" (si confirmation activée)
```html
<h2>Bienvenue !</h2>
<p>Cliquez sur le lien ci-dessous pour activer votre compte et définir votre mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Activer mon compte</a></p>
<p>Ce lien expire dans 24 heures.</p>
```

#### Template "Reset password" (pour réinitialisation)
```html
<h2>Réinitialisation de mot de passe</h2>
<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
```

### ✅ Étape 4 : Vérifier les Rate Limits

1. Allez dans **Authentication** → **Rate Limits**
2. Assurez-vous que les limites ne sont pas trop restrictives :
   - **Email signups** : Au moins 10 par heure
   - **Password resets** : Au moins 10 par heure
3. Cliquez sur **Save** si vous modifiez

### ✅ Étape 5 : Configurer SMTP (Optionnel mais recommandé)

Par défaut, Supabase utilise son propre service d'envoi qui peut être limité.

1. Allez dans **Project Settings** → **Auth**
2. Faites défiler jusqu'à **SMTP Settings**
3. Configurez votre service SMTP :

**Pour Gmail :**
```
Host: smtp.gmail.com
Port: 587
Username: votre-email@gmail.com
Password: [App Password - pas votre mot de passe Gmail]
Sender email: votre-email@gmail.com
Sender name: Crèche LPRDS
```

**Pour SendGrid (recommandé pour production) :**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Votre clé API SendGrid]
Sender email: noreply@votre-domaine.com
Sender name: Crèche LPRDS
```

## 🧪 Test du Flux Complet

### Test 1 : Création d'un Parent

1. **Ouvrez la console du navigateur** (F12)
2. Connectez-vous en tant qu'admin
3. Allez dans **Parents** → **Ajouter un parent**
4. Remplissez le formulaire avec un email de test
5. Cliquez sur **Créer**

**Dans la console, vous devriez voir :**
```
Creating parent account with email: test@example.com
Email redirect URL: http://localhost:5173/reset-password
SignUp response: { user: "test@example.com", error: null }
```

### Test 2 : Vérification dans Supabase

1. Allez dans **Authentication** → **Users**
2. Trouvez l'utilisateur créé
3. Vérifiez :
   - ✅ Email présent
   - ✅ Created at (date récente)
   - ⚠️ Email Confirmed (peut être false si confirmation activée)

### Test 3 : Email Reçu

1. Vérifiez la boîte email (et **dossier spam !**)
2. Vous devriez recevoir un email avec un lien
3. Le lien devrait ressembler à :
```
http://localhost:5173/reset-password?type=signup&access_token=...&refresh_token=...
```

### Test 4 : Clic sur le Lien

1. **Ouvrez la console du navigateur** (F12)
2. Cliquez sur le lien dans l'email
3. Vous devriez être redirigé vers `/reset-password`

**Dans la console, vous devriez voir :**
```
Reset password URL parameters: { type: "signup", access_token: "...", refresh_token: "..." }
Link type: signup
Setting session with tokens...
Session established successfully: test@example.com
```

### Test 5 : Définition du Mot de Passe

1. Entrez un nouveau mot de passe (min 6 caractères)
2. Confirmez le mot de passe
3. Cliquez sur **Définir le mot de passe**
4. Vous devriez être redirigé vers `/parent/dashboard`

## 🐛 Dépannage

### Problème : Aucun email reçu

**Solutions :**
1. Vérifiez le dossier **spam**
2. Vérifiez dans Supabase **Authentication** → **Logs**
3. Si "Enable email confirmations" est activé, essayez de le désactiver
4. Configurez un service SMTP personnalisé
5. Vérifiez les rate limits

### Problème : Email reçu mais lien ne fonctionne pas

**Solutions :**
1. Vérifiez que l'URL de redirection est dans la liste autorisée
2. Vérifiez les logs de la console navigateur
3. Vérifiez que la route `/reset-password` existe dans `App.tsx`

### Problème : Page 404 après clic sur le lien

**Solutions :**
1. Vérifiez que la route `/reset-password` est bien définie dans `src/App.tsx`
2. Vérifiez que l'URL de redirection dans Supabase correspond exactement

### Problème : "Lien invalide ou expiré"

**Solutions :**
1. Les liens expirent après 24h - générez un nouveau lien
2. Vérifiez que les tokens sont présents dans l'URL
3. Essayez de recréer le compte

## 📊 Vérification Finale

Après configuration, vérifiez :

- [ ] URLs de redirection configurées dans Supabase
- [ ] Confirmation d'email configurée (activée ou désactivée)
- [ ] Templates d'email vérifiés
- [ ] Rate limits appropriés
- [ ] SMTP configuré (optionnel)
- [ ] Test de création de parent réussi
- [ ] Email reçu
- [ ] Lien fonctionne
- [ ] Mot de passe défini avec succès
- [ ] Redirection vers dashboard OK

## 🎉 Configuration Réussie !

Si tous les tests passent, votre configuration est correcte et le flux fonctionne :

1. **Admin crée un parent** → Compte créé dans Supabase
2. **Email envoyé automatiquement** → Parent reçoit l'email
3. **Parent clique sur le lien** → Redirigé vers `/reset-password`
4. **Parent définit son mot de passe** → Compte activé
5. **Redirection automatique** → Parent accède à son dashboard

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs dans la console navigateur (F12)
2. Vérifiez les logs dans Supabase Dashboard → Authentication → Logs
3. Consultez `TROUBLESHOOTING_EMAILS.md` pour plus de détails

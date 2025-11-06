# Guide de Dépannage - Problèmes d'Emails Supabase

## Symptômes

1. ✉️ **Les emails d'activation de compte ne sont pas reçus** lors de la création d'un parent ou d'un membre du personnel
2. 🔑 **Les emails de réinitialisation de mot de passe ne sont pas reçus**
3. ❌ **Le lien dans l'email mène à une page 404**

## Diagnostic

### Étape 1 : Vérifier les logs de la console navigateur

Ouvrez la console du navigateur (F12) et créez un nouveau parent ou membre du personnel. Vous devriez voir des logs comme :

```
Creating parent account with email: parent@example.com
Email redirect URL: http://localhost:5173/reset-password
SignUp response: { user: "parent@example.com", error: null }
```

**Si vous voyez une erreur :**
- `rate limit` ou `429` → Trop d'emails envoyés, attendez quelques minutes
- `User already registered` → L'email existe déjà dans la base de données
- Autre erreur → Notez l'erreur exacte pour investigation

### Étape 2 : Vérifier dans le Dashboard Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Authentication > Users**
4. Vérifiez si l'utilisateur a été créé
5. Regardez la colonne "Email Confirmed" :
   - ✅ Si confirmé → Le problème est ailleurs
   - ❌ Si non confirmé → C'est normal, l'utilisateur doit cliquer sur le lien

### Étape 3 : Vérifier les logs d'authentification

Dans le Dashboard Supabase :
1. Allez dans **Authentication > Logs**
2. Cherchez les entrées récentes pour l'email concerné
3. Vérifiez s'il y a des erreurs d'envoi d'email

## Solutions

### Solution 1 : Configurer les URL de redirection autorisées

**C'est la cause la plus fréquente !**

1. Dans le Dashboard Supabase, allez dans **Authentication > URL Configuration**
2. Dans "Redirect URLs", ajoutez :
   ```
   http://localhost:5173/reset-password
   http://localhost:5173/*
   https://votre-domaine.com/reset-password
   https://votre-domaine.com/*
   ```
3. Cliquez sur "Save"

### Solution 2 : Désactiver la confirmation d'email (Recommandé pour usage interne)

Si votre application est pour un usage interne (crèche) et que vous faites confiance aux emails :

1. Allez dans **Authentication > Providers**
2. Cliquez sur **Email**
3. Décochez "**Enable email confirmations**"
4. Cliquez sur "Save"

**Avantages :**
- Les comptes sont immédiatement actifs
- Pas besoin d'attendre que l'utilisateur clique sur le lien
- Simplifie le processus pour les utilisateurs non techniques

**Inconvénients :**
- Moins sécurisé (mais acceptable pour usage interne)
- Vous devez vous assurer que les emails sont corrects

### Solution 3 : Configurer un service SMTP personnalisé

Par défaut, Supabase utilise son propre service d'envoi d'emails qui peut être limité :

1. Allez dans **Project Settings > Auth**
2. Configurez un service SMTP (Gmail, SendGrid, Mailgun, etc.)
3. Pour les tests, utilisez [Mailtrap](https://mailtrap.io/) (gratuit)

### Solution 4 : Vérifier les templates d'email

1. Allez dans **Authentication > Email Templates**
2. Vérifiez le template "**Confirm signup**"
3. Assurez-vous qu'il contient `{{ .ConfirmationURL }}`
4. Vérifiez le template "**Reset password**"
5. Assurez-vous qu'il contient `{{ .ConfirmationURL }}`

### Solution 5 : Augmenter les limites de rate limiting

1. Allez dans **Authentication > Rate Limits**
2. Augmentez les limites pour :
   - Email signups
   - Password resets
3. Sauvegardez

## Workflow de Test

### Test 1 : Création de compte parent

1. Ouvrez la console navigateur (F12)
2. Allez dans l'interface admin
3. Créez un nouveau parent
4. Vérifiez les logs dans la console
5. Vérifiez dans Supabase Dashboard > Authentication > Users
6. Vérifiez votre boîte email (ou spam)

### Test 2 : Réinitialisation de mot de passe

1. Ouvrez la console navigateur (F12)
2. Allez sur `/admin/forgot-password`
3. Entrez un email existant
4. Vérifiez les logs dans la console :
   ```
   Sending password reset email to: user@example.com
   Redirect URL: http://localhost:5173/reset-password
   Password reset email sent successfully
   ```
5. Vérifiez votre boîte email

### Test 3 : Lien de réinitialisation

1. Cliquez sur le lien dans l'email
2. Vous devriez arriver sur `/reset-password`
3. Ouvrez la console et vérifiez les logs :
   ```
   Reset password URL parameters: { type: "recovery", access_token: "...", ... }
   Link type: recovery
   Setting session with tokens...
   Session established successfully: user@example.com
   ```
4. Définissez un nouveau mot de passe
5. Vous devriez être redirigé vers le dashboard approprié

## Alternatives si rien ne fonctionne

### Option A : Créer les comptes manuellement dans Supabase

1. Allez dans **Authentication > Users**
2. Cliquez sur "Add user"
3. Entrez l'email et un mot de passe temporaire
4. Cochez "Auto Confirm User"
5. Envoyez le mot de passe temporaire à l'utilisateur par un autre moyen
6. Demandez-lui de se connecter et de changer son mot de passe

### Option B : Utiliser une fonction Edge pour envoyer des emails personnalisés

Créez une fonction Supabase Edge qui envoie des emails via un service tiers (SendGrid, etc.) avec un lien de réinitialisation personnalisé.

## Vérifications de sécurité

⚠️ **Important :** Si vous désactivez la confirmation d'email :

1. Assurez-vous que seuls les administrateurs peuvent créer des comptes
2. Vérifiez toujours les emails avant de créer un compte
3. Activez l'authentification à deux facteurs pour les comptes admin
4. Surveillez les logs d'authentification régulièrement

## Support

Si le problème persiste après avoir essayé toutes ces solutions :

1. Vérifiez les logs détaillés dans la console navigateur
2. Vérifiez les logs dans Supabase Dashboard > Authentication > Logs
3. Contactez le support Supabase avec les informations suivantes :
   - Project ID : `bzksmrrlqjkhfgxevedl`
   - Description du problème
   - Logs d'erreur
   - Captures d'écran

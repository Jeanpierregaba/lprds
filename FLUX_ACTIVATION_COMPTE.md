# Flux d'Activation de Compte Parent

## 🎯 Vue d'ensemble

Ce document explique le flux complet d'activation de compte pour les parents dans l'application LPRDS.

## 📊 Diagramme du Flux

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ADMIN CRÉE UN PARENT                                         │
│    - Interface: /admin/dashboard/parents                        │
│    - Fichier: src/pages/admin/ParentsPage.tsx                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SUPABASE CRÉE LE COMPTE                                      │
│    - Méthode: supabase.auth.signUp()                           │
│    - Email: email du parent                                     │
│    - Password: Temporaire aléatoire                            │
│    - Options:                                                   │
│      • emailRedirectTo: /reset-password                        │
│      • data: { first_name, last_name, role: 'parent' }        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. SUPABASE ENVOIE L'EMAIL                                      │
│    - Template: "Confirm signup" (si confirmation activée)      │
│    - Contenu: Lien d'activation avec tokens                    │
│    - URL: http://localhost:5173/reset-password?                │
│           type=signup&                                          │
│           access_token=...&                                     │
│           refresh_token=...                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. PARENT REÇOIT L'EMAIL                                        │
│    - Sujet: "Activez votre compte" ou similaire                │
│    - Contenu: Lien cliquable                                   │
│    - Expiration: 24 heures                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PARENT CLIQUE SUR LE LIEN                                    │
│    - Redirection vers: /reset-password                         │
│    - Paramètres URL:                                           │
│      • type=signup                                             │
│      • access_token=...                                        │
│      • refresh_token=...                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PAGE RESET PASSWORD S'AFFICHE                                │
│    - Fichier: src/pages/ResetPassword.tsx                      │
│    - Détecte type=signup                                       │
│    - Affiche: "Activez votre compte"                           │
│    - Description: "Bienvenue ! Choisissez un mot de passe..."  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. ÉTABLISSEMENT DE LA SESSION                                  │
│    - Méthode: supabase.auth.setSession()                       │
│    - Utilise: access_token et refresh_token de l'URL           │
│    - Résultat: Session active pour l'utilisateur               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. PARENT DÉFINIT SON MOT DE PASSE                              │
│    - Saisie: Nouveau mot de passe (min 6 caractères)           │
│    - Confirmation: Re-saisie du mot de passe                   │
│    - Validation: Vérification que les mots de passe matchent   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. MISE À JOUR DU MOT DE PASSE                                  │
│    - Méthode: supabase.auth.updateUser({ password })           │
│    - Résultat: Mot de passe enregistré                         │
│    - Toast: "Compte activé avec succès !"                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. REDIRECTION VERS LE DASHBOARD                               │
│     - Récupération du profil (role)                            │
│     - Si role=parent → /parent/dashboard                       │
│     - Si role=educator → /educator/dashboard                   │
│     - Si role=admin → /admin/dashboard                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Fichiers Impliqués

### 1. ParentsPage.tsx
**Chemin:** `src/pages/admin/ParentsPage.tsx`

**Fonction:** `onSubmitParent()`

**Code clé:**
```typescript
const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email: values.email,
  password: Math.random().toString(36).slice(-8) + 'Aa1!',
  options: {
    emailRedirectTo: `${siteUrl}/reset-password`,
    data: {
      first_name: values.first_name,
      last_name: values.last_name,
      role: 'parent',
    },
  },
});
```

### 2. ResetPassword.tsx
**Chemin:** `src/pages/ResetPassword.tsx`

**Fonctions principales:**
- `initializeAuth()` - Gère les tokens de l'URL et établit la session
- `handleSubmit()` - Met à jour le mot de passe et redirige

**Code clé:**
```typescript
// Détection du type
if (type === 'signup' || type === 'invite') {
  setIsSignup(true);
}

// Établissement de la session
const { data, error } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken
});

// Mise à jour du mot de passe
const { error } = await supabase.auth.updateUser({
  password: password
});
```

### 3. App.tsx
**Chemin:** `src/App.tsx`

**Routes nécessaires:**
```typescript
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/admin/login" element={<Login />} />
<Route path="/admin/forgot-password" element={<ForgotPassword />} />
```

### 4. useAuth.tsx
**Chemin:** `src/hooks/useAuth.tsx`

**Fonction:** `resetPassword()` - Pour la réinitialisation de mot de passe oublié

## ⚙️ Configuration Supabase Requise

### 1. URL de Redirection
Dans **Authentication → URL Configuration**, ajouter :
```
http://localhost:5173/reset-password
http://localhost:5173/*
https://votre-domaine.com/reset-password
https://votre-domaine.com/*
```

### 2. Confirmation d'Email
Dans **Authentication → Providers → Email** :

**Option A (Recommandée pour usage interne):**
- ✅ Décocher "Enable email confirmations"
- Le compte est immédiatement actif
- L'email est quand même envoyé pour définir le mot de passe

**Option B (Plus sécurisé):**
- ✅ Garder "Enable email confirmations" activé
- Le parent doit cliquer sur le lien pour activer le compte
- Puis définir son mot de passe

### 3. Template d'Email
Dans **Authentication → Email Templates → Confirm signup** :
```html
<h2>Bienvenue à la Crèche LPRDS !</h2>
<p>Votre compte parent a été créé. Cliquez sur le lien ci-dessous pour activer votre compte et définir votre mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Activer mon compte</a></p>
<p>Ce lien expire dans 24 heures.</p>
<p>Si vous n'avez pas demandé cette activation, ignorez cet email.</p>
```

## 🧪 Comment Tester

### Test Complet

1. **Prérequis:**
   - Configuration Supabase complétée
   - Application en cours d'exécution (`npm run dev`)
   - Console navigateur ouverte (F12)

2. **Étapes:**
   ```
   1. Connectez-vous en tant qu'admin
   2. Allez dans Parents → Ajouter un parent
   3. Remplissez le formulaire avec un email de test
   4. Cliquez sur "Créer"
   5. Vérifiez les logs dans la console
   6. Vérifiez l'email reçu (et dossier spam)
   7. Cliquez sur le lien dans l'email
   8. Vérifiez que vous êtes sur /reset-password
   9. Vérifiez les logs de la console
   10. Définissez un mot de passe
   11. Vérifiez la redirection vers /parent/dashboard
   ```

3. **Logs Attendus:**

   **Lors de la création:**
   ```
   Creating parent account with email: test@example.com
   Email redirect URL: http://localhost:5173/reset-password
   SignUp response: { user: "test@example.com", error: null }
   ```

   **Lors du clic sur le lien:**
   ```
   Reset password URL parameters: { type: "signup", access_token: "...", ... }
   Link type: signup
   Setting session with tokens...
   Session established successfully: test@example.com
   ```

## 🐛 Problèmes Courants

### Problème 1: Email non reçu
**Solutions:**
1. Vérifier le dossier spam
2. Vérifier Supabase → Authentication → Logs
3. Désactiver "Enable email confirmations"
4. Configurer un service SMTP

### Problème 2: Page 404 après clic
**Solutions:**
1. Vérifier que `/reset-password` est dans les URL autorisées
2. Vérifier que la route existe dans `App.tsx`
3. Vérifier les logs de la console

### Problème 3: "Lien invalide ou expiré"
**Solutions:**
1. Le lien expire après 24h - recréer le compte
2. Vérifier que les tokens sont dans l'URL
3. Vérifier la configuration Supabase

### Problème 4: Erreur lors de la définition du mot de passe
**Solutions:**
1. Vérifier que la session est établie (logs console)
2. Vérifier que le mot de passe fait au moins 6 caractères
3. Vérifier les logs Supabase

## 📋 Checklist de Vérification

Avant de considérer que le flux fonctionne :

- [ ] Configuration Supabase complétée
- [ ] URLs de redirection configurées
- [ ] Template d'email vérifié
- [ ] Route `/reset-password` existe dans App.tsx
- [ ] Test de création de parent réussi
- [ ] Email reçu (vérifier spam)
- [ ] Lien cliquable fonctionne
- [ ] Page ResetPassword s'affiche correctement
- [ ] Titre adapté ("Activez votre compte")
- [ ] Session établie (vérifier logs)
- [ ] Mot de passe défini avec succès
- [ ] Redirection vers /parent/dashboard OK
- [ ] Parent peut se connecter avec son nouveau mot de passe

## 📚 Documents Connexes

- `SUPABASE_EMAIL_CONFIG.md` - Configuration détaillée de Supabase
- `TROUBLESHOOTING_EMAILS.md` - Guide de dépannage complet
- `CONFIGURATION_SUPABASE_ETAPES.md` - Étapes de configuration pas à pas

## 🎉 Conclusion

Le flux d'activation de compte est maintenant complètement implémenté et documenté. Si vous suivez les étapes de configuration et que tous les tests passent, les parents pourront :

1. ✅ Recevoir un email d'activation automatiquement
2. ✅ Cliquer sur le lien et être redirigés vers la bonne page
3. ✅ Définir leur mot de passe en toute sécurité
4. ✅ Accéder à leur dashboard parent immédiatement

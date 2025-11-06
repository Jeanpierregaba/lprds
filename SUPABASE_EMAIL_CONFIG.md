# Configuration des Emails Supabase

## Problème actuel
Les emails d'activation de compte et de réinitialisation de mot de passe ne fonctionnent pas correctement.

## Solutions à appliquer dans le Dashboard Supabase

### 1. Configurer les URL de redirection autorisées

Allez dans **Authentication > URL Configuration** et ajoutez :
- `http://localhost:5173/reset-password` (développement)
- `https://votre-domaine.com/reset-password` (production)

### 2. Désactiver la confirmation d'email (Option recommandée pour usage interne)

Allez dans **Authentication > Providers > Email** et :
- Décochez "Enable email confirmations"
- OU configurez les templates d'email avec les bonnes URLs

### 3. Configurer les templates d'email

Si vous gardez la confirmation d'email activée, allez dans **Authentication > Email Templates** et vérifiez que :

#### Template "Confirm signup"
```
<h2>Confirmez votre inscription</h2>
<p>Cliquez sur le lien ci-dessous pour activer votre compte et définir votre mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Activer mon compte</a></p>
```

#### Template "Reset password"
```
<h2>Réinitialisation de mot de passe</h2>
<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
```

### 4. Vérifier les paramètres SMTP (si emails non reçus)

Allez dans **Project Settings > Auth** et vérifiez :
- Que les emails ne sont pas bloqués par un filtre anti-spam
- Que le service SMTP est correctement configuré
- Pour les tests, vous pouvez utiliser un service comme Mailtrap

### 5. Vérifier les Rate Limits

Dans **Authentication > Rate Limits**, assurez-vous que les limites ne sont pas trop restrictives pour les tests.

## Test de la configuration

1. Créez un nouveau parent dans l'interface admin
2. Vérifiez les logs de la console navigateur pour voir les erreurs éventuelles
3. Vérifiez dans le Dashboard Supabase > Authentication > Users que l'utilisateur est créé
4. Vérifiez dans le Dashboard Supabase > Authentication > Logs pour voir les tentatives d'envoi d'email

## Alternative : Invitation manuelle

Si les emails ne fonctionnent toujours pas, vous pouvez :
1. Créer l'utilisateur dans le Dashboard Supabase directement
2. Lui envoyer manuellement un lien de réinitialisation de mot de passe
3. Ou désactiver complètement la confirmation d'email pour un usage interne

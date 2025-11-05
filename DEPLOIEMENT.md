# Guide de Déploiement - LPRDS

## ✅ Configuration Complétée

Le fichier `.htaccess` a été créé et configuré pour résoudre les problèmes de routing SPA sur hébergement mutualisé Apache.

## 📁 Structure du Build

Après `npm run build`, votre dossier `dist` contient :
- `index.html` - Point d'entrée de l'application
- `.htaccess` - Configuration Apache pour le routing
- `_redirects` - Configuration Netlify (ignoré par Apache)
- `robots.txt` - Configuration SEO
- `assets/` - Fichiers JS, CSS et images
- `fonts/` - Polices personnalisées

## 🔧 Ce que fait le .htaccess

### 1. **Résolution du problème MIME type**
- Configure correctement les types MIME pour `.js`, `.css`, `.json`, etc.
- Empêche l'erreur "Expected a JavaScript module script but the server responded with a MIME type of text/html"

### 2. **Routing SPA (Single Page Application)**
- Redirige toutes les routes vers `index.html`
- Permet le rafraîchissement de page sur n'importe quelle route :
  - `/admin/dashboard` ✅
  - `/educator/dashboard` ✅
  - `/parent/dashboard` ✅
  - `/admin/dashboard/children` ✅
  - etc.

### 3. **Optimisations de Performance**
- Compression Gzip activée
- Cache des ressources statiques (images, fonts, CSS, JS)
- Pas de cache pour `index.html` (pour les mises à jour)

### 4. **Sécurité**
- Protection XSS
- Protection contre le MIME sniffing
- Protection Clickjacking
- Désactivation du listage des répertoires
- Blocage des fichiers sensibles (.env, .git, etc.)

## 🚀 Étapes de Déploiement

### 1. Build de Production
```bash
npm run build
```

### 2. Vérification du Build
Vérifiez que le dossier `dist` contient bien :
- ✅ `.htaccess` (3.3 KB)
- ✅ `index.html`
- ✅ Dossier `assets/`
- ✅ Dossier `fonts/`

### 3. Upload sur l'Hébergement Mutualisé

**Option A : FTP/SFTP**
1. Connectez-vous à votre hébergeur via FTP (FileZilla, WinSCP, etc.)
2. Naviguez vers le dossier racine de votre site (souvent `public_html` ou `www`)
3. Uploadez **TOUT** le contenu du dossier `dist` (pas le dossier lui-même)
4. Assurez-vous que le fichier `.htaccess` est bien uploadé (il peut être caché)

**Option B : cPanel File Manager**
1. Connectez-vous à cPanel
2. Ouvrez "File Manager"
3. Naviguez vers `public_html`
4. Uploadez tout le contenu de `dist`
5. Vérifiez que `.htaccess` est présent (activez "Show Hidden Files")

### 4. Vérification Post-Déploiement

Testez ces scénarios :
- ✅ Page d'accueil : `https://votresite.com/`
- ✅ Route admin : `https://votresite.com/admin/dashboard`
- ✅ Rafraîchir la page admin (F5) → Doit fonctionner sans erreur
- ✅ Route educator : `https://votresite.com/educator/dashboard`
- ✅ Rafraîchir la page educator (F5) → Doit fonctionner sans erreur
- ✅ Console du navigateur → Aucune erreur MIME type

## 🐛 Dépannage

### Problème : Le .htaccess ne fonctionne pas

**Solution 1 : Vérifier que mod_rewrite est activé**
Contactez votre hébergeur pour vérifier que le module Apache `mod_rewrite` est activé.

**Solution 2 : Vérifier les permissions**
Le fichier `.htaccess` doit avoir les permissions 644 :
```bash
chmod 644 .htaccess
```

**Solution 3 : Vérifier le AllowOverride**
Votre hébergeur doit autoriser les directives `.htaccess`. Si ce n'est pas le cas, contactez le support.

### Problème : Erreur 500 Internal Server Error

**Cause possible** : Directive non supportée par votre hébergeur

**Solution** : Commentez progressivement les sections du `.htaccess` pour identifier la directive problématique :
1. Commentez d'abord la section "Compression Gzip"
2. Puis "Cache des ressources statiques"
3. Gardez uniquement les sections "Rewrite" et "MIME types"

### Problème : Les images/fonts ne se chargent pas

**Solution** : Vérifiez que :
1. Les dossiers `assets/` et `fonts/` sont bien uploadés
2. Les permissions sont correctes (755 pour les dossiers, 644 pour les fichiers)
3. Le chemin dans `vite.config.ts` utilise bien `base: './'` (relatif)

## 📝 Configuration Vite

La configuration actuelle dans `vite.config.ts` :
```typescript
base: './'  // ✅ Chemins relatifs pour hébergement mutualisé
```

**Important** : Ne changez pas cette valeur ! Les chemins relatifs sont essentiels pour un hébergement mutualisé.

## 🔄 Mises à Jour Futures

Pour chaque mise à jour :
1. `npm run build`
2. Uploadez **tout** le contenu de `dist` (écrasez les anciens fichiers)
3. Videz le cache du navigateur (Ctrl + F5)

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs d'erreur de votre hébergeur
3. Contactez le support de votre hébergeur pour vérifier :
   - `mod_rewrite` est activé
   - `AllowOverride All` est configuré
   - Les types MIME sont correctement configurés

## ✨ Routes de l'Application

### Routes Publiques
- `/` - Page d'accueil
- `/about` - À propos
- `/sections` - Sections
- `/gallery` - Galerie
- `/news` - Actualités
- `/contact` - Contact
- `/login` - Connexion
- `/forgot-password` - Mot de passe oublié
- `/reset-password` - Réinitialisation du mot de passe

### Routes Protégées - Admin
- `/admin/dashboard` - Vue d'ensemble
- `/admin/dashboard/children` - Gestion des enfants
- `/admin/dashboard/staff` - Gestion du personnel
- `/admin/dashboard/parents` - Gestion des parents
- `/admin/dashboard/attendance` - Présences
- `/admin/dashboard/qr-scanner` - Scanner QR
- `/admin/dashboard/daily-reports` - Rapports quotidiens
- `/admin/dashboard/messages` - Messages
- `/admin/dashboard/settings` - Paramètres

### Routes Protégées - Éducateur
- `/educator/dashboard` - Groupe de l'éducateur
- `/educator/dashboard/attendance` - Présences
- `/educator/dashboard/daily-reports` - Rapports quotidiens

### Routes Protégées - Parent
- `/parent/dashboard` - Tableau de bord parent

---

**Date de configuration** : 5 novembre 2025
**Version** : 1.0.0

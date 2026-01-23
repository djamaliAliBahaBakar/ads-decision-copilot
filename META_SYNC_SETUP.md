# Meta Ads Sync Setup Guide

Ce guide explique comment configurer et utiliser le système de synchronisation automatique avec Meta (Facebook) Ads.

## 📋 Prérequis

1. **Application Meta (Facebook) Developer**
   - Créer une app sur [developers.facebook.com](https://developers.facebook.com/)
   - Obtenir l'App ID et l'App Secret
   - Configurer les permissions : `ads_read`, `ads_management`, `business_management`

2. **Variables d'environnement**

## ⚙️ Configuration

### 1. Variables d'environnement

Ajouter dans `.env.local` :

```bash
# Meta API Credentials
NEXT_PUBLIC_META_APP_ID="your_app_id"
META_APP_SECRET="your_app_secret"
META_REDIRECT_URI="http://localhost:3000/dashboard/settings/meta-callback"

# Cron Secret (pour sécuriser les endpoints)
CRON_SECRET="your_secret_key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Configuration Meta App

Dans le Meta Developer Dashboard :

1. **Aller dans Settings → Basic**
   - Noter l'App ID et l'App Secret
   - Ajouter le domaine de l'app dans "App Domains"

2. **Aller dans Products → Facebook Login → Settings**
   - Ajouter l'URL de callback :
     - Dev: `http://localhost:3000/dashboard/settings/meta-callback`
     - Prod: `https://votredomaine.com/dashboard/settings/meta-callback`

3. **Permissions**
   - Demander les permissions suivantes dans le dashboard :
     - `ads_read`
     - `ads_management`
     - `business_management`

## 🔄 Fonctionnement du Sync

### Sync Manuel

L'utilisateur peut sync manuellement depuis **Settings** :
1. Cliquer sur "Connecter Meta"
2. S'authentifier avec Facebook
3. Autoriser l'application
4. Cliquer sur "🔄 Sync maintenant" pour forcer un sync

### Sync Automatique

Le système sync automatiquement **tous les jours à 6h UTC** via un cron job :
- Récupère tous les comptes Meta actifs
- Pour chaque compte :
  - Récupère les campagnes
  - Récupère les ads avec leurs insights (7 derniers jours)
  - Calcule les métriques (CPL, CTR, conversions)
  - Upsert dans la base de données

## 🚀 Déploiement en Production (Vercel)

### 1. Configurer les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables :

```bash
NEXT_PUBLIC_META_APP_ID="your_app_id"
META_APP_SECRET="your_app_secret"
META_REDIRECT_URI="https://votredomaine.com/dashboard/settings/meta-callback"
CRON_SECRET="votre_secret_production"
NEXT_PUBLIC_APP_URL="https://votredomaine.com"
```

### 2. Configurer le Cron Job Vercel

Dans Vercel Dashboard → Settings → Cron Jobs → **Add Cron Job** :

**Configuration :**
```
Path: /api/cron/sync-meta
Schedule: 0 6 * * *
Description: Daily Meta Ads sync at 6 AM UTC
```

**Headers :**
```
Authorization: Bearer votre_secret_production
```

**Autres options de schedule :**
- `0 6 * * *` = Tous les jours à 6h UTC (recommandé)
- `0 */12 * * *` = Toutes les 12 heures
- `0 8,18 * * *` = À 8h et 18h UTC

### 3. Mettre à jour l'app Meta en production

Dans Meta Developer Dashboard :
- Passer l'app en mode "Live" (pas en Development)
- Ajouter le domaine de production dans "App Domains"
- Mettre à jour l'OAuth Redirect URI avec le domaine de production

## 🧪 Tester le Sync

### Option 1 : Test manuel via API (dev)

```bash
# Avec curl
curl -X POST http://localhost:3000/api/meta/sync \
  -H "Authorization: Bearer your_secret_key"

# Ou via navigateur
http://localhost:3000/api/meta/sync?authorization=Bearer your_secret_key
```

**Response attendue :**
```json
{
  "success": true,
  "totalAccounts": 1,
  "successCount": 1,
  "errorCount": 0,
  "results": [
    {
      "userId": "user_xxx",
      "email": "user@example.com",
      "accountName": "Mon compte Meta",
      "status": "success",
      "adsCount": 15
    }
  ],
  "timestamp": "2024-01-23T10:30:00.000Z"
}
```

### Option 2 : Test du cron job complet

```bash
curl -X GET http://localhost:3000/api/cron/sync-meta \
  -H "Authorization: Bearer your_secret_key"
```

### Option 3 : Test via UI

1. Aller sur `/dashboard/settings`
2. Connecter un compte Meta
3. Cliquer sur "🔄 Sync maintenant"
4. Vérifier dans le dashboard que les ads apparaissent

## 📊 Données Synchronisées

Pour chaque ad, le système récupère :
- **Nom de l'ad** (`adName`)
- **Nom de la campagne** (`campaignName`)
- **Spend** (dépense en €)
- **Impressions**
- **Clicks**
- **Leads** (conversions de type "lead")
- **CTR** (click-through rate)
- **CPL** (cost per lead)
- **Meta Ad ID** et **Campaign ID** pour tracking

## 🔍 Monitoring & Debugging

### Vérifier le statut du sync

1. **Via l'UI** : `/dashboard/settings`
   - Voir le dernier sync
   - Voir les erreurs éventuelles
   - Indicateur "Sync auto quotidien activé"

2. **Via Prisma Studio** : `npx prisma studio`
   - Table `MetaAccount` → colonne `syncStatus`, `lastSyncAt`, `syncError`
   - Table `Ad` → voir les ads importées avec `metaAdId` rempli

3. **Via les logs Vercel** (production)
   - Dashboard Vercel → Functions → `/api/cron/sync-meta`
   - Voir les logs de chaque exécution

### Logs importants

Les logs suivent le format :
```
[Meta Sync] Starting sync for user xxx (account: Mon Compte)
[Meta Sync] Found 3 campaigns
[Meta Sync] Successfully synced 15 ads for user xxx
```

### Erreurs communes

#### "Meta account not connected"
- L'utilisateur n'a pas connecté son compte Meta
- Solution : Aller dans Settings et connecter Meta

#### "Invalid OAuth access token"
- Le token Meta a expiré (durée de vie : 60 jours)
- Solution : Déconnecter et reconnecter le compte Meta

#### "Failed to fetch campaigns"
- Problème d'API Meta ou permissions insuffisantes
- Solution : Vérifier les permissions de l'app Meta

#### "No ad accounts found"
- L'utilisateur n'a pas de compte publicitaire Meta
- Solution : Créer un compte publicitaire sur Meta Business Manager

## 🔐 Sécurité

### Tokens Meta

- Les access tokens sont stockés en clair dans la DB (à chiffrer en production!)
- Durée de vie : 60 jours (nécessite re-authentication après)
- Permissions minimales : `ads_read`

### Endpoints sécurisés

Tous les endpoints de sync sont protégés par `CRON_SECRET` :
- `/api/meta/sync` - Sync tous les comptes
- `/api/cron/sync-meta` - Cron job wrapper

**Ne JAMAIS exposer ces URLs publiquement sans authentification.**

## 📈 Optimisations futures

- [ ] Chiffrer les access tokens dans la DB
- [ ] Refresh automatique des tokens expirants
- [ ] Sync incrémental (seulement les nouvelles données)
- [ ] Rate limiting pour l'API Meta
- [ ] Support multi-comptes publicitaires par utilisateur
- [ ] Webhook Meta pour sync en temps réel
- [ ] Filtres sur les campagnes à synchroniser

## 🆘 Support

En cas de problème :
1. Vérifier les logs console/Vercel
2. Vérifier les permissions Meta
3. Vérifier que l'app Meta est en mode "Live"
4. Consulter la doc Meta API : [developers.facebook.com/docs/marketing-api](https://developers.facebook.com/docs/marketing-api)

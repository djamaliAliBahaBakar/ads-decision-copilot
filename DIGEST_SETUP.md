# Weekly Digest Email Setup

Ce guide explique comment configurer et tester le système d'emails hebdomadaires (Weekly Reports).

## 📋 Prérequis

1. **Compte Resend** : Créer un compte sur [resend.com](https://resend.com)
2. **API Key Resend** : Générer une clé API dans le dashboard Resend
3. **Domaine vérifié** (optionnel pour dev) : Configurer un domaine ou utiliser l'adresse de test Resend

## ⚙️ Configuration Locale

### 1. Variables d'environnement

Ajouter dans `.env.local` :

```bash
# Email Service
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# App URL (pour les liens dans l'email)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron Secret (pour sécuriser les endpoints)
CRON_SECRET="your_secret_key"
```

### 2. Configuration Resend

Dans le dashboard Resend :
- Aller dans **API Keys** et copier votre clé

**Pour le développement :**
- L'adresse par défaut `onboarding@resend.dev` est utilisée automatiquement
- Aucune configuration supplémentaire nécessaire

**Pour la production :**
- Aller dans **Domains** et vérifier votre domaine
- Ajouter la variable d'environnement :
  ```bash
  RESEND_FROM_EMAIL="Tiltmeter <digest@votredomaine.com>"
  ```

## 🧪 Tester en Local

### Option 1 : Test direct via API

1. S'assurer qu'il y a au moins un utilisateur dans la DB (créer un compte via Clerk)
2. Lancer le dev server : `npm run dev`
3. Ouvrir dans le navigateur :
   ```
   http://localhost:3000/api/test/trigger-digest
   ```
4. Vérifier :
   - Response JSON avec `success: true`
   - Email reçu dans la boîte de réception de l'utilisateur
   - Console logs pour debugging

### Option 2 : Test manuel via code

```typescript
import { generateWeeklyDigest } from '@/app/actions/digest'

// Dans un composant ou action
await generateWeeklyDigest('USER_ID_HERE')
```

## 🚀 Déploiement en Production (Vercel)

### 1. Configurer les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables :

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
NEXT_PUBLIC_APP_URL="https://votredomaine.com"
CRON_SECRET="votre_secret_production"
```

### 2. Configurer le Cron Job

Dans Vercel Dashboard → Settings → Cron Jobs → **Add Cron Job** :

**Configuration recommandée :**
```
Path: /api/cron/send-digests
Schedule: 0 9 * * 1
Description: Send weekly digest emails every Monday at 9 AM UTC
```

**Autres options de schedule :**
- `0 9 * * 1` = Tous les lundis à 9h UTC (recommandé)
- `0 8 * * 1` = Tous les lundis à 8h UTC
- `0 10 * * 5` = Tous les vendredis à 10h UTC

**Headers :**
```
Authorization: Bearer votre_secret_production
```

### 3. Vérifier le déploiement

1. Aller sur Vercel → Deployments → Dernière version
2. Vérifier que les variables d'environnement sont bien chargées
3. Tester manuellement le cron :
   ```bash
   curl -X GET https://votredomaine.com/api/cron/send-digests \
     -H "Authorization: Bearer votre_secret_production"
   ```

## 📧 Contenu du Digest

Le digest hebdomadaire contient :
- **Discipline Score** : % de décisions suivant les règles définies
- **Économies réalisées** : Total des savings de la semaine
- **Meilleure décision** : Top SCALE de la semaine
- **Pire décision** : Top KILL de la semaine
- **Tendance CPL** : Évolution vs semaine précédente
- **Insight actionable** : Recommandation personnalisée

## 🔍 Debugging

### Email non reçu

1. **Vérifier les logs du terminal** : Chercher les erreurs Resend (API key invalide, domaine non vérifié, etc.)
2. **Vérifier l'adresse "from"** :
   - En dev : Devrait utiliser `onboarding@resend.dev` automatiquement
   - En prod : Vérifier que `RESEND_FROM_EMAIL` pointe vers un domaine vérifié
3. **Vérifier les logs Resend Dashboard** : [resend.com/emails](https://resend.com/emails) pour voir si l'email a été envoyé
4. **Vérifier le dossier spam** de votre boîte email
5. **Tester avec une autre adresse email** : Certains providers bloquent les emails de test
6. Vérifier que `RESEND_API_KEY` est correct dans `.env.local`
7. Vérifier que l'email du user existe dans la DB : `npx prisma studio` → Table User

### Digest vide ou incomplet

1. S'assurer qu'il y a des données (ads, decisions, rules) dans la semaine
2. Vérifier le calcul des dates dans `generateWeeklyDigest()`
3. Checker que `onboardingCompleted = true` pour l'utilisateur

### Cron ne se déclenche pas

1. Vérifier que le cron job est bien configuré dans Vercel
2. Vérifier le secret dans les headers
3. Checker les logs Vercel → Functions → Cron

## 🎨 Personnalisation

### Changer le design de l'email

Éditer le template HTML dans `app/actions/digest.ts` ligne 163-253.

### Ajouter des métriques

1. Calculer la métrique dans `generateWeeklyDigest()`
2. Ajouter au modèle `EmailDigest` dans `prisma/schema.prisma`
3. Run `npx prisma db push`
4. Mettre à jour le template email

### Changer la fréquence

Modifier le schedule du cron job Vercel (voir section Déploiement).

## 📊 Monitoring

Pour suivre les envois d'emails :

1. **Dashboard Resend** : Voir les emails envoyés, ouverts, erreurs
2. **Prisma Studio** : `npx prisma studio` → Table `EmailDigest`
3. **Vercel Logs** : Dashboard Vercel → Functions → `/api/cron/send-digests`

## ⚠️ Notes Importantes

- **Route de test** (`/api/test/trigger-digest`) est **désactivée en production** pour des raisons de sécurité
- Les digests ne sont envoyés qu'**une seule fois par semaine** (vérification DB)
- Les utilisateurs peuvent activer/désactiver les digests dans Settings
- L'email `from` doit être un domaine vérifié dans Resend (sauf en dev)

## 🆘 Support

En cas de problème :
1. Vérifier les logs console
2. Consulter la doc Resend : [resend.com/docs](https://resend.com/docs)
3. Vérifier la doc Vercel Cron : [vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)

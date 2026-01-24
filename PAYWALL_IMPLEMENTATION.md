# Implémentation Paywall - Ads Decision

## 🎯 Vue d'ensemble

Système de paywall robuste avec 3 niveaux d'accès et bypass SUPERUSER.

---

## 📊 Niveaux d'Accès

| Niveau | Description | Accès |
|--------|-------------|-------|
| `FREE_PREVIEW` | Utilisateur gratuit (défaut) | Voir suggestions, pas créer de décision |
| `PAID` | Abonné payant | Toutes les fonctionnalités |
| `SUPERUSER` | Admin/fondateur | Bypass total |

### Détection SUPERUSER

1. **Via Clerk metadata** (prioritaire) : `publicMetadata.role = "SUPERUSER"`
2. **Via DB** : `Subscription.accessLevel = "SUPERUSER"`

---

## 🗄️ Schéma Prisma

```prisma
enum AccessLevel {
  FREE_PREVIEW
  PAID
  SUPERUSER
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  EXPIRED
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(...)

  accessLevel AccessLevel @default(FREE_PREVIEW)

  // Stripe
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?

  // Status
  status         SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean @default(false)

  // Billing
  plan           String?  // "monthly" | "quarterly"
  amount         Int?     // cents (2900 = 29€)
  currency       String   @default("eur")

  // Early adopter
  isEarlyAdopter Boolean @default(false)
  earlyAdopterUntil DateTime?
}
```

---

## 🔐 Fichiers de Sécurité

### `lib/access.ts` (server-only)

```typescript
// Fonction principale - récupère l'accès de l'utilisateur courant
export async function getAccess(): Promise<AccessInfo | null>

// Guards pour Server Actions et API routes
export async function requirePaidAccess(): Promise<AccessInfo>  // throws si pas payé
export async function requireAccess(): Promise<AccessInfo>      // throws si pas authentifié
export async function requireSuperuser(): Promise<AccessInfo>   // throws si pas superuser

// Check de feature spécifique
export async function checkFeatureAccess(feature: string): Promise<AccessCheckResult>

// Utilitaires admin
export async function upgradeUserToPaid(userId, stripeData): Promise<void>
export async function downgradeUser(userId): Promise<void>
export async function grantSuperuser(userId): Promise<void>
```

### `lib/use-access.ts` (client)

```typescript
// Hook React pour accéder aux permissions
export function useAccess(): UseAccessReturn

// Helper pour vérifier si feature verrouillée
export function isFeatureLocked(access, feature): boolean
```

---

## 🧩 Composants Paywall

### `<PaywallModal />`
Modal principal avec le copy produit.

```tsx
<PaywallModal
  isOpen={true}
  onClose={() => {}}
  onSuccess={() => {}}
/>
```

### `<LockedFeature />`
Wrapper qui verrouille une fonctionnalité.

```tsx
<LockedFeature feature="canCreateDecision">
  <CreateDecisionButton />
</LockedFeature>
```

### `<LockedButton />`
Bouton qui ouvre le paywall si verrouillé.

```tsx
<LockedButton feature="canExportData">
  Exporter les données
</LockedButton>
```

### `<PaymentSuccess />`
Écran affiché après paiement réussi.

### `<PaywallProvider />`
Context provider pour l'état global du paywall.

---

## 🛡️ Protection des Server Actions

### Exemple : `logDecision`

```typescript
export async function logDecision(data: {...}) {
  // ⚡ PAYWALL GUARD
  await requirePaidAccess()

  // ... reste du code
}
```

### Permissions disponibles

```typescript
interface AccessInfo {
  level: AccessLevel
  isPaid: boolean
  isSuperuser: boolean
  canCreateDecision: boolean      // Créer une décision
  canViewDecisionDetails: boolean // Voir les détails d'une décision
  canExportData: boolean          // Exporter les données
  canCreateCustomRules: boolean   // Créer des règles personnalisées
  canAccessFullJournal: boolean   // Accès complet au journal
}
```

---

## 💳 Intégration Stripe

### API Routes

| Route | Description |
|-------|-------------|
| `POST /api/stripe/checkout` | Crée une session Checkout |
| `POST /api/stripe/webhook` | Gère les événements Stripe |

### Variables d'environnement

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_QUARTERLY=price_xxx
NEXT_PUBLIC_APP_URL=https://app.adsdecision.com
```

### Événements gérés

- `checkout.session.completed` → Upgrade to PAID
- `customer.subscription.updated` → Update period
- `customer.subscription.deleted` → Downgrade to FREE_PREVIEW
- `invoice.payment_failed` → Log warning

---

## 🌍 Internationalisation

### Structure i18n

```
lib/i18n/
├── index.ts      # Exports et helpers
└── fr.ts         # Traductions françaises
```

### Usage

```typescript
import { t } from '@/lib/i18n'

const translations = t()
console.log(translations.nav.dashboard) // "Tableau de bord"
```

### Ajouter une langue

1. Créer `lib/i18n/en.ts`
2. Ajouter dans `translations` dans `index.ts`
3. Implémenter détection de locale

---

## 📁 Fichiers Créés

### Schéma
- `prisma/schema.prisma` - Ajout Subscription model

### Sécurité
- `lib/access.ts` - Guards server-side
- `lib/use-access.ts` - Hook client

### API
- `app/api/access/route.ts` - GET access info
- `app/api/stripe/checkout/route.ts` - Create checkout session
- `app/api/stripe/webhook/route.ts` - Handle Stripe events

### Composants
- `components/paywall/paywall-modal.tsx`
- `components/paywall/locked-feature.tsx`
- `components/paywall/payment-success.tsx`
- `components/paywall/paywall-provider.tsx`
- `components/paywall/index.ts`

### Pages
- `app/payment/success/page.tsx`

### i18n
- `lib/i18n/index.ts`
- `lib/i18n/fr.ts`

### Modifiés
- `app/actions/decisions.ts` - Ajout guard sur logDecision
- `app/dashboard/layout.tsx` - Ajout PaywallProvider
- `components/layout/sidebar.tsx` - Menus en français

---

## 🧪 Tester le Paywall

### 1. Sans Stripe (mode dev)

```bash
# Le checkout redirige vers /payment/success avec mock session
npm run dev
```

### 2. Avec Stripe CLI

```bash
# Terminal 1: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 2: Dev server
npm run dev
```

### 3. Tester les niveaux d'accès

```typescript
// Dans Clerk Dashboard, ajouter à un utilisateur:
// publicMetadata: { "role": "SUPERUSER" }

// Ou via Prisma Studio:
npx prisma studio
// Créer une Subscription avec accessLevel: "PAID"
```

---

## ✅ Checklist Déploiement

### Stripe

- [ ] Créer compte Stripe
- [ ] Créer produits et prix (29€/mois, 79€/trimestre)
- [ ] Copier les price IDs dans env vars
- [ ] Configurer webhook endpoint
- [ ] Tester en mode test

### Variables d'environnement

```env
# Production
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_QUARTERLY=price_xxx
NEXT_PUBLIC_APP_URL=https://app.adsdecision.com
```

### Base de données

```bash
# Appliquer les migrations
npx prisma db push
```

### SUPERUSER

1. Se connecter avec le compte fondateur
2. Dans Clerk Dashboard, ajouter `{ "role": "SUPERUSER" }` aux publicMetadata
3. Ou créer une Subscription avec `accessLevel: "SUPERUSER"` en DB

---

## 🎨 Copy Paywall

### Titre
> Accès complet à Ads Decision

### Sous-titre
> Tu as vu ce que l'outil peut faire. Maintenant, utilise-le pour de vrai.

### Offre
> Tarif early adopter — valable jusqu'au 28 février 2026
> 29 €/mois ou 79 €/trimestre (économise 8 €)

### CTA
> Débloquer l'accès complet

### Micro-rassurance
> Paiement sécurisé. Annulable à tout moment depuis les paramètres.

### Message fermeture
> Tu peux continuer à explorer. L'accès complet sera là quand tu seras prêt.

---

## 🚀 Résultat

- ✅ Paywall robuste avec vérification serveur
- ✅ 3 niveaux d'accès (FREE_PREVIEW, PAID, SUPERUSER)
- ✅ Bypass SUPERUSER via Clerk ou DB
- ✅ Guards sur Server Actions
- ✅ Composants UI professionnels
- ✅ Intégration Stripe prête
- ✅ i18n préparé (français)
- ✅ Menus en français

**Le paywall est prêt pour la production!** 🎉

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AdsDecision** is a Meta advertising decision support system that helps marketers make data-driven decisions about their ad campaigns. The app tracks ad performance, suggests actions (KILL, SCALE, HOLD, TEST, FIX) based on user-defined rules, and measures discipline through a "Tiltmeter" system that tracks whether users follow their own rules.

### Big Idea / Proposition de valeur
> "Ton meilleur angle créatif marche 2x mieux que ton pire. Trouve-le. Décide. Économise."

### Design Principles
- **Une page = Une idée = Une action claire** (pas de mélange d'intentions)
- Focus sur la valeur, pas les barrières (freemium = opportunité, pas frustration)
- Animations fluides et feedback visuel immédiat

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL (hosted on Supabase) via Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe (subscriptions)
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Email**: Resend for weekly digests
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## Features Summary

### Core Features

| Feature | Description | Location |
|---------|-------------|----------|
| **Angles Dashboard** | Vue centrée sur les angles créatifs avec CPL et performance | `/dashboard` |
| **Decision Board** | Suggestions KILL/SCALE/HOLD basées sur les règles | `/dashboard/decisions` |
| **Journal** | Historique des décisions avec notes | `/dashboard/journal` |
| **Import CSV** | Upload des données Meta Ads | `/dashboard/upload` |
| **Règles personnalisées** | Création de règles de décision | Onboarding + Settings |
| **Tiltmeter** | Suivi de la discipline (règles suivies vs ignorées) | Dashboard + Digest |

### Freemium System

| Niveau | Accès | Comment obtenir |
|--------|-------|-----------------|
| **FREE_PREVIEW** | 3 décisions gratuites | Par défaut (nouveaux users) |
| **PAID** | Décisions illimitées + Digest + Tiltmeter | Abonnement Stripe |
| **SUPERUSER** | Tout illimité + Admin | Clerk metadata `role=SUPERUSER` |

**Fichiers clés:**
- `lib/access.ts` - Logique d'accès et permissions
- `lib/use-access.ts` - Hook client pour vérifier l'accès
- `components/paywall/` - Modal paywall et composants LockedFeature
- `app/actions/decisions.ts` - Vérification quota dans `logDecision()`

### Onboarding Flow (4 étapes)

1. **Value Preview** (`step1-value-preview.tsx`) - Hook avec demo data + économies potentielles
2. **Upload CSV** (`step1-upload.tsx`) - Import des données Meta
3. **Setup Performance** (`setup-performance.tsx`) - Révélation des vrais résultats
4. **Tour** (`onboarding-tour.tsx`) - Présentation des features

### Payments (Stripe)

- **Checkout**: `/api/stripe/checkout` - Crée une session Stripe
- **Webhook**: `/api/stripe/webhook` - Gère les événements (subscription.created, etc.)
- **Success page**: `/payment/success` - Confirmation après paiement
- **Paywall Modal**: `components/paywall/paywall-modal.tsx`

### Email Digests

Weekly performance emails sent via Resend:
- **Triggered by**: Cron job at `/api/cron/send-digests/route.ts` (Monday 9 AM UTC)
- **Content**: Discipline score, savings, best/worst decisions, CPL trends
- **User control**: Enable/disable in `/dashboard/settings`

### Meta API Sync

- **OAuth connection**: `/dashboard/settings`
- **Manual sync**: Button in settings
- **Auto sync**: Daily cron at 6 AM UTC via `/api/cron/sync-meta`
- **Data imported**: Campaigns, ads, spend, impressions, clicks, leads, CPL, CTR

### Legal Pages

- **CGV**: `/cgv` - Conditions Générales de Vente
- **Mentions Légales**: `/mentions-legales` - Legal Notice
- Links in: Sidebar footer, Sign-in, Sign-up pages

## Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Linting
npm run lint             # Run ESLint

# Database
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Push schema changes to database (dev)
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI
npm run prisma:seed      # Seed database (requires existing Clerk user)
```

## Architecture Overview

### Authentication Flow

All authenticated operations use the `getOrCreateUser()` helper from `lib/get-or-create-user.ts`:
- Fetches the current Clerk user ID
- Looks up the corresponding user in Prisma by `clerkId`
- Auto-creates the user in Prisma if not found (syncing email from Clerk)
- **Pattern**: Always call `getOrCreateUser()` at the start of server actions

### Access Control Flow

```typescript
// Server-side (actions, API routes)
import { getAccess, requirePaidAccess } from '@/lib/access'

const access = await getAccess()
if (!access.isPaid) { /* show paywall */ }

// Client-side (components)
import { useAccess } from '@/lib/use-access'
import { LockedFeature } from '@/components/paywall'

const { access, loading } = useAccess()

<LockedFeature feature="canCreateDecision">
  <Button>Décider</Button>
</LockedFeature>
```

### Data Layer Pattern: Server Actions

The app uses Next.js Server Actions exclusively for data operations:
- **Location**: `app/actions/*.ts` files
- **Convention**: All actions marked with `'use server'` directive
- **Examples**:
  - `app/actions/decisions.ts` - Decision CRUD, suggestions, quota, savings
  - `app/actions/ads.ts` - Ad data management, angles performance
  - `app/actions/rules.ts` - User rules management
  - `app/actions/meta.ts` - Meta API sync operations

### Key Server Actions

| Action | File | Description |
|--------|------|-------------|
| `getDecisionSuggestions()` | decisions.ts | Suggestions KILL/SCALE/HOLD |
| `logDecision()` | decisions.ts | Sauvegarder une décision (avec check quota) |
| `getDecisionQuota()` | decisions.ts | Quota restant (FREE: 3, PAID: illimité) |
| `getRealizedSavings()` | decisions.ts | Économies réalisées via décisions KILL |
| `getAnglesPerformance()` | ads.ts | Performance par angle créatif |

### Database Models (Prisma)

**Core entities**:
- `User` - Synced with Clerk, one per user
- `Ad` - Individual ad performance data (CPL, spend, leads, angle, etc.)
- `Decision` - Actions taken on ads (KILL/SCALE/HOLD with reasoning)
- `UserRule` - User-defined decision rules
- `MetaAccount` - Meta API credentials and sync status
- `Subscription` - Stripe subscription data and access level
- `EmailDigest` - Weekly performance email data

**Key relationships**:
- User → Ads (one-to-many)
- User → Decisions (one-to-many)
- User → Subscription (one-to-one)
- Ad → Decisions (one-to-many)
- User → UserRules (one-to-many)
- User → MetaAccount (one-to-one)

### Page Structure

```
app/
├── (auth)/              # Clerk auth pages (sign-in, sign-up)
├── dashboard/           # Main authenticated app
│   ├── page.tsx         # Angles performance dashboard
│   ├── decisions/       # Decision board with suggestions
│   ├── journal/         # Decision history
│   ├── upload/          # CSV upload for ad data
│   └── settings/        # Account & Meta connection
├── onboarding/          # 4-step onboarding flow
├── cgv/                 # Terms of sale
├── mentions-legales/    # Legal notice
├── payment/success/     # Post-payment confirmation
├── actions/             # Server actions (data layer)
└── api/                 # API routes (webhooks, cron only)
```

### Component Organization

```
components/
├── ui/              # Shadcn/Radix base components
├── decisions/       # Decision modal, cards
├── paywall/         # PaywallModal, LockedFeature, PaywallProvider
├── tiltmeter/       # Discipline tracking UI
├── digest/          # Email digest components
├── journal/         # Decision journal components
├── meta/            # Meta API integration UI
├── onboarding/      # Onboarding flow (4 steps)
├── layout/          # Sidebar with navigation
└── whatif/          # What-if analysis components
```

## Environment Variables

Required in `.env.local`:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."      # Pooled connection
DIRECT_URL="postgresql://..."        # Direct connection for migrations

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Stripe Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_PRICE_MONTHLY="price_..."
STRIPE_PRICE_QUARTERLY="price_..."

# Meta API (optional)
META_APP_ID="..."
META_APP_SECRET="..."
META_REDIRECT_URI="..."

# Resend (optional for emails)
RESEND_API_KEY="..."

# Cron jobs
CRON_SECRET="..."
```

## Key Conventions

1. **Authentication**: Always use `getOrCreateUser()` for authenticated server actions
2. **Access control**: Use `getAccess()` server-side, `useAccess()` client-side
3. **Paywall**: Use `<LockedFeature feature="...">` or `usePaywall()` hook
4. **Database queries**: Use the Prisma singleton from `lib/prisma.ts`
5. **Server Actions**: Preferred over API routes for data operations
6. **Path alias**: Use `@/` to reference root directory
7. **Design**: slate-950 for text, blue-600 for primary, green for success/actions

## UX Patterns

### Freemium UX
- Show value BEFORE asking for data (onboarding)
- Display savings realized (positive reinforcement)
- Paywall = "Opportunité" not "Limite atteinte"
- Open paywall automatically when quota exceeded (no error message)

### Error Handling
```typescript
// In decisions page - detect quota error → open paywall
if (errorMessage.includes('limite') || errorMessage.includes('décisions gratuites')) {
  setShowModal(false)
  openPaywall() // Instead of showing error
}
```

### Before opening decision modal
```typescript
// Check quota BEFORE letting user fill form
if (quota && !quota.isPaid && quota.remaining <= 0) {
  openPaywall()
  return
}
```

## Data Seeding

Run `npx prisma db seed` to populate test data:
- Requires at least one user created via Clerk
- Creates 30 days of fake ad data
- Creates 3 default rules
- Useful for testing decision suggestions and charts

## Legal Information

- **Éditeur**: Djamali Ali baha bakar (Auto-entrepreneur)
- **Email**: contact@adsdecision.com
- **Hébergeur**: Vercel

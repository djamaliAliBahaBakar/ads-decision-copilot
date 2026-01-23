# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AdsDecision** is a Meta advertising decision support system that helps marketers make data-driven decisions about their ad campaigns. The app tracks ad performance, suggests actions (KILL, SCALE, HOLD, TEST, FIX) based on user-defined rules, and measures discipline through a "Tiltmeter" system that tracks whether users follow their own rules.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL (hosted on Supabase) via Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Email**: Resend for weekly digests
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

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
- **Pattern**: Always call `getOrCreateUser()` at the start of server actions instead of manually querying users

### Data Layer Pattern: Server Actions

The app uses Next.js Server Actions exclusively for data operations (no traditional API routes for business logic):
- **Location**: `app/actions/*.ts` files
- **Convention**: All actions are marked with `'use server'` directive
- **Usage**: Import and call directly from client components
- **Examples**:
  - `app/actions/decisions.ts` - Decision CRUD and suggestions
  - `app/actions/ads.ts` - Ad data management
  - `app/actions/rules.ts` - User rules management
  - `app/actions/meta.ts` - Meta API sync operations
  - `app/actions/performance.ts` - Analytics and reporting

### Database Models (Prisma)

**Core entities**:
- `User` - Synced with Clerk, one per user
- `Ad` - Individual ad performance data (CPL, spend, leads, angle, etc.)
- `Decision` - Actions taken on ads (KILL/SCALE/HOLD with reasoning)
- `UserRule` - User-defined decision rules (e.g., "kill_if_cpl > €10 for 3 days")
- `MetaAccount` - Meta API credentials and sync status
- `EmailDigest` - Weekly performance email data

**Key relationships**:
- User → Ads (one-to-many)
- User → Decisions (one-to-many)
- Ad → Decisions (one-to-many)
- User → UserRules (one-to-many)
- User → MetaAccount (one-to-one)

### Prisma Client Singleton

Import the Prisma client from `lib/prisma.ts`, which implements the singleton pattern to prevent multiple instances in development hot-reload scenarios.

```typescript
import { prisma } from '@/lib/prisma'
```

### Page Structure

```
app/
├── (auth)/              # Clerk auth pages (sign-in, sign-up)
├── dashboard/           # Main authenticated app
│   ├── page.tsx         # Decision suggestions dashboard
│   ├── decisions/       # Decision history/journal
│   ├── performance/     # Analytics and charts
│   ├── journal/         # Decision journal
│   ├── upload/          # CSV upload for ad data
│   └── settings/        # Meta account connection
├── onboarding/          # First-time user setup flow
├── actions/             # Server actions (data layer)
└── api/                 # API routes (webhooks, cron jobs only)
```

### Component Organization

Components are organized by feature domain:

```
components/
├── ui/              # Shadcn/Radix base components (Button, Dialog, etc.)
├── decisions/       # Decision-related components
├── tiltmeter/       # Discipline tracking UI
├── digest/          # Email digest components
├── journal/         # Decision journal components
├── meta/            # Meta API integration UI
├── onboarding/      # Onboarding flow components
└── whatif/          # What-if analysis components
```

### Decision Suggestion Engine

The core business logic lives in `app/actions/decisions.ts`:

1. **`getDecisionSuggestions()`**:
   - Fetches last 14 days of ad data
   - Groups by `adName` (most recent entry per ad)
   - Calculates 3-day CPL trends
   - Matches against active `UserRule`s
   - Returns suggested actions (KILL/SCALE/HOLD) with confidence levels

2. **`logDecision()`**:
   - Creates a `Decision` record
   - **Tiltmeter tracking**: Checks if decision matches any applicable rule
   - Sets `followedRule` boolean and `appliedRuleId` for discipline scoring

### Tiltmeter Concept

The "Tiltmeter" measures user discipline:
- When a decision is logged, check if any `UserRule` applied to that situation
- Track whether the user's action matched what the rule suggested
- `followedRule` = true if user followed their own rule, false if they deviated
- Used in weekly digests to show discipline score

### Meta API Sync

Automatic synchronization with Meta (Facebook) Ads:
- **OAuth connection**: Users connect via `/dashboard/settings`
- **Data stored in**: `MetaAccount` table (access token, account ID, sync status)
- **Manual sync**: Button in settings UI calls `syncMetaAds()`
- **Automatic sync**: Daily cron job at 6 AM UTC via `/api/cron/sync-meta`
- **Sync endpoint**: `/api/meta/sync` (used by cron, requires CRON_SECRET)
- **Data imported**: Campaigns, ads, spend, impressions, clicks, leads (conversions), CPL, CTR
- **Tracking**: `metaAdId` and `metaCampaignId` fields link ads to Meta
- **Configuration**: See `META_SYNC_SETUP.md` for complete setup guide
- **Key function**: `syncMetaAdsForUser(userId)` - used by cron (no auth context needed)

### Onboarding Flow

New users go through `/onboarding`:
1. Upload CSV of historical ad data (or skip)
2. AI analyzes worst-performing ad
3. User makes first decision and creates initial rules
4. `onboardingCompleted` flag set to true
5. Redirected to dashboard

### Email Digests

Weekly performance emails sent via Resend:
- **Triggered by**: Cron job at `/api/cron/send-digests/route.ts` (Monday 9 AM UTC)
- **Data stored in**: `EmailDigest` table
- **Content**: Discipline score, savings, best/worst decisions, CPL trends, actionable insights
- **Testing**: `GET /api/test/trigger-digest` (dev only)
- **Configuration**: See `DIGEST_SETUP.md` for complete setup guide
- **User control**: Users can enable/disable digests in `/dashboard/settings`

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

# Meta API (optional for sync)
META_APP_ID="..."
META_APP_SECRET="..."
META_REDIRECT_URI="..."

# Resend (optional for emails)
RESEND_API_KEY="..."
```

## Key Conventions

1. **Authentication**: Always use `getOrCreateUser()` for authenticated server actions
2. **Database queries**: Use the Prisma singleton from `lib/prisma.ts`
3. **Server Actions**: Preferred over API routes for data operations
4. **Type safety**: Import Prisma types from `@prisma/client`
5. **Path alias**: Use `@/` to reference root directory (configured in tsconfig.json)
6. **Middleware**: Clerk authentication enforced in `middleware.ts` (all routes except auth and webhooks)

## Data Seeding

Run `npx prisma db seed` to populate test data:
- Requires at least one user created via Clerk
- Creates 30 days of fake ad data
- Creates 3 default rules
- Useful for testing decision suggestions and charts

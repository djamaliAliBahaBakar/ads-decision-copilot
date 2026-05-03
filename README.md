# AdsDecision 📊

A Meta Ads decision support system that helps marketers stop guessing and start deciding.

> **Built with vibe coding** — designed, iterated and shipped with AI-assisted development.

> *"Ton meilleur créatif marche 2x mieux que ton pire. Trouve-le. Décide. Économise."*

---

## The problem

Most advertisers running Meta Ads have the same issues:

```
→ They can't tell which ads are really working
→ They keep running underperforming ads too long
→ They make emotional decisions instead of rule-based ones
→ They don't measure whether they follow their own rules
```

AdsDecision fixes this with a simple loop:

```
Import data → Get suggestions → Decide → Measure discipline
```

---

## What it does

| Feature | Description |
|---------|-------------|
| **Performance Dashboard** | Top/worst ads by CPL, spend, leads |
| **Decision Board** | KILL / SCALE / HOLD / TEST / FIX suggestions based on your rules |
| **Tiltmeter** | Tracks whether you follow your own rules (benchmark: 75%+) |
| **Journal** | Decision history with realized savings |
| **CSV Import** | Auto-detects Meta Ads export format (FR/EN) |
| **Weekly Digest** | Email summary every Monday — discipline score + best decisions |
| **Custom Rules** | Define your own decision criteria at onboarding |

---

## Freemium system

```
FREE_PREVIEW  → 3 free decisions (default)
PAID          → Unlimited decisions + Digest + Tiltmeter
SUPERUSER     → Everything unlimited (internal)
```

Paywall logic: show value before asking for payment. The onboarding reveals real results from your data before asking for a subscription.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Database | PostgreSQL via Prisma (Supabase) |
| Auth | Clerk |
| Payments | Stripe (subscriptions + webhooks) |
| Styling | Tailwind CSS 4 + Radix UI |
| Email | Resend (weekly digests) |
| Validation | React Hook Form + Zod |
| Charts | Recharts |
| Hosting | Vercel |

---

## Architecture

```
app/
├── dashboard/          # Main authenticated app
│   ├── page.tsx        # Performance summary (KPIs, discipline, top/worst)
│   ├── decisions/      # Decision board with KILL/SCALE/HOLD suggestions
│   ├── journal/        # Decision history with realized impact
│   ├── upload/         # CSV import (Meta FR/EN auto-detection)
│   └── settings/       # Rules + account + subscription
├── onboarding/         # 4-step onboarding flow
├── api/
│   ├── stripe/         # Checkout + webhook
│   └── cron/           # Weekly digest + Meta sync
└── actions/            # Server Actions (data layer)
```

---

## Key patterns

```typescript
// Access control — server side
const access = await getAccess()
if (!access.isPaid) { /* trigger paywall */ }

// Access control — client side
<LockedFeature feature="canCreateDecision">
  <Button>Décider</Button>
</LockedFeature>

// Quota check before opening modal
if (quota && !quota.isPaid && quota.remaining <= 0) {
  openPaywall()
  return
}
```

---

## Cron jobs

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Weekly digest | Monday 9 AM UTC | `/api/cron/send-digests` |
| Meta sync (v1) | Daily 6 AM UTC | `/api/cron/sync-meta` |

---

## About vibe coding

This project was built using **vibe coding** — a development approach where AI assists at every step: architecture decisions, component design, bug fixing, and iteration.

```
→ Faster time to market
→ Focus on product decisions, not boilerplate
→ AI as co-pilot, human as architect
```

The result is a production-ready SaaS with auth, payments, cron jobs, and freemium logic — shipped in a fraction of the usual time.

---

## Status

**MVP V0 — Production**  
Live on Vercel. CSV import active. Meta API sync ready (disabled for MVP).

---

## Author

**Djamali Ali Baha Bakar** — AI Builder & Developer  

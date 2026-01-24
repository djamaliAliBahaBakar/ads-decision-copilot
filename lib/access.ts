import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AccessLevel } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export interface AccessInfo {
  level: AccessLevel
  isPaid: boolean
  isSuperuser: boolean
  canCreateDecision: boolean
  canViewDecisionDetails: boolean
  canExportData: boolean
  canCreateCustomRules: boolean
  canAccessFullJournal: boolean
  subscription: {
    status: string | null
    plan: string | null
    expiresAt: Date | null
    isEarlyAdopter: boolean
  } | null
}

export interface AccessCheckResult {
  allowed: boolean
  reason?: string
  requiredLevel?: AccessLevel
}

// ============================================
// CORE ACCESS FUNCTION (SERVER-ONLY)
// ============================================

/**
 * Get the current user's access level and permissions
 * This is the main function to check access server-side
 *
 * Priority:
 * 1. Clerk metadata (role=SUPERUSER) - instant bypass
 * 2. DB Subscription.accessLevel
 * 3. Default: FREE_PREVIEW
 */
export async function getAccess(): Promise<AccessInfo | null> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return null
  }

  // Check Clerk metadata for SUPERUSER
  const clerkUser = await currentUser()
  const clerkRole = clerkUser?.publicMetadata?.role as string | undefined

  if (clerkRole === 'SUPERUSER') {
    return {
      level: 'SUPERUSER' as AccessLevel,
      isPaid: true,
      isSuperuser: true,
      canCreateDecision: true,
      canViewDecisionDetails: true,
      canExportData: true,
      canCreateCustomRules: true,
      canAccessFullJournal: true,
      subscription: null,
    }
  }

  // Get user from DB with subscription
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      subscription: true,
    },
  })

  if (!user) {
    return null
  }

  // Determine access level from subscription
  const subscription = user.subscription
  let level: AccessLevel = 'FREE_PREVIEW'

  if (subscription) {
    // Check if subscription is active
    if (subscription.status === 'ACTIVE') {
      level = subscription.accessLevel
    } else if (subscription.status === 'PAST_DUE') {
      // Grace period: still give access but flag it
      level = subscription.accessLevel
    } else {
      level = 'FREE_PREVIEW'
    }
  }

  // Build permissions based on level
  const isPaid = level === 'PAID' || level === 'SUPERUSER'
  const isSuperuser = level === 'SUPERUSER'

  return {
    level,
    isPaid,
    isSuperuser,
    canCreateDecision: isPaid,
    canViewDecisionDetails: isPaid,
    canExportData: isPaid,
    canCreateCustomRules: isPaid,
    canAccessFullJournal: isPaid,
    subscription: subscription
      ? {
          status: subscription.status,
          plan: subscription.plan,
          expiresAt: subscription.currentPeriodEnd,
          isEarlyAdopter: subscription.isEarlyAdopter,
        }
      : null,
  }
}

// ============================================
// ACCESS GUARDS
// ============================================

/**
 * Check if a specific feature is accessible
 */
export async function checkFeatureAccess(
  feature: keyof Omit<AccessInfo, 'level' | 'isPaid' | 'isSuperuser' | 'subscription'>
): Promise<AccessCheckResult> {
  const access = await getAccess()

  if (!access) {
    return {
      allowed: false,
      reason: 'not_authenticated',
    }
  }

  if (access[feature]) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'feature_locked',
    requiredLevel: 'PAID',
  }
}

/**
 * Require paid access - throws if not paid
 * Use in Server Actions and API routes
 */
export async function requirePaidAccess(): Promise<AccessInfo> {
  const access = await getAccess()

  if (!access) {
    throw new AccessError('not_authenticated', 'Vous devez être connecté.')
  }

  if (!access.isPaid) {
    throw new AccessError('payment_required', 'Cette fonctionnalité nécessite un abonnement.')
  }

  return access
}

/**
 * Require any access (authenticated)
 */
export async function requireAccess(): Promise<AccessInfo> {
  const access = await getAccess()

  if (!access) {
    throw new AccessError('not_authenticated', 'Vous devez être connecté.')
  }

  return access
}

/**
 * Require superuser access
 */
export async function requireSuperuser(): Promise<AccessInfo> {
  const access = await getAccess()

  if (!access) {
    throw new AccessError('not_authenticated', 'Vous devez être connecté.')
  }

  if (!access.isSuperuser) {
    throw new AccessError('superuser_required', 'Accès réservé aux administrateurs.')
  }

  return access
}

// ============================================
// ACCESS ERROR
// ============================================

export type AccessErrorCode =
  | 'not_authenticated'
  | 'payment_required'
  | 'feature_locked'
  | 'superuser_required'

export class AccessError extends Error {
  code: AccessErrorCode

  constructor(code: AccessErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'AccessError'
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get access level for a specific user ID (admin use)
 */
export async function getAccessForUser(userId: string): Promise<AccessInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  })

  if (!user) return null

  const subscription = user.subscription
  let level: AccessLevel = 'FREE_PREVIEW'

  if (subscription?.status === 'ACTIVE') {
    level = subscription.accessLevel
  }

  const isPaid = level === 'PAID' || level === 'SUPERUSER'
  const isSuperuser = level === 'SUPERUSER'

  return {
    level,
    isPaid,
    isSuperuser,
    canCreateDecision: isPaid,
    canViewDecisionDetails: isPaid,
    canExportData: isPaid,
    canCreateCustomRules: isPaid,
    canAccessFullJournal: isPaid,
    subscription: subscription
      ? {
          status: subscription.status,
          plan: subscription.plan,
          expiresAt: subscription.currentPeriodEnd,
          isEarlyAdopter: subscription.isEarlyAdopter,
        }
      : null,
  }
}

/**
 * Upgrade user to PAID (after Stripe webhook)
 */
export async function upgradeUserToPaid(
  userId: string,
  stripeData: {
    customerId: string
    subscriptionId: string
    priceId: string
    plan: 'monthly' | 'quarterly'
    amount: number
    periodEnd: Date
  }
): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      accessLevel: 'PAID',
      status: 'ACTIVE',
      stripeCustomerId: stripeData.customerId,
      stripeSubscriptionId: stripeData.subscriptionId,
      stripePriceId: stripeData.priceId,
      plan: stripeData.plan,
      amount: stripeData.amount,
      currentPeriodStart: new Date(),
      currentPeriodEnd: stripeData.periodEnd,
      isEarlyAdopter: true, // All early users are early adopters
      earlyAdopterUntil: new Date('2026-02-28'),
    },
    update: {
      accessLevel: 'PAID',
      status: 'ACTIVE',
      stripeCustomerId: stripeData.customerId,
      stripeSubscriptionId: stripeData.subscriptionId,
      stripePriceId: stripeData.priceId,
      plan: stripeData.plan,
      amount: stripeData.amount,
      currentPeriodEnd: stripeData.periodEnd,
    },
  })
}

/**
 * Downgrade user to FREE_PREVIEW (subscription cancelled/expired)
 */
export async function downgradeUser(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      accessLevel: 'FREE_PREVIEW',
      status: 'EXPIRED',
    },
  })
}

/**
 * Grant SUPERUSER access (admin only)
 */
export async function grantSuperuser(userId: string): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      accessLevel: 'SUPERUSER',
      status: 'ACTIVE',
    },
    update: {
      accessLevel: 'SUPERUSER',
      status: 'ACTIVE',
    },
  })
}

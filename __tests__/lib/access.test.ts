/**
 * Tests for access level system
 *
 * Access levels:
 * - FREE_PREVIEW: Limited features (3 decisions)
 * - PAID: Full features
 * - SUPERUSER: Admin access (via Clerk metadata)
 */

import { prismaMock } from '../mocks/prisma'

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'

// Import access functions after mocking
const accessModule = require('@/lib/access')

describe('Access System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAccess', () => {
    it('should return null for unauthenticated user', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: null })

      const access = await accessModule.getAccess()

      expect(access).toBeNull()
    })

    it('should return SUPERUSER for user with SUPERUSER role in Clerk metadata', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: 'clerk_123' })
      ;(currentUser as jest.Mock).mockResolvedValue({
        id: 'clerk_123',
        publicMetadata: { role: 'SUPERUSER' },
      })

      const access = await accessModule.getAccess()

      expect(access.level).toBe('SUPERUSER')
      expect(access.isSuperuser).toBe(true)
      expect(access.isPaid).toBe(true)
      expect(access.canCreateDecision).toBe(true)
    })

    it('should return FREE_PREVIEW for user without subscription', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: 'clerk_123' })
      ;(currentUser as jest.Mock).mockResolvedValue({
        id: 'clerk_123',
        publicMetadata: {},
      })

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_123',
        clerkId: 'clerk_123',
        subscription: null,
      })

      const access = await accessModule.getAccess()

      expect(access.level).toBe('FREE_PREVIEW')
      expect(access.isPaid).toBe(false)
      expect(access.canCreateDecision).toBe(false)
    })

    it('should return PAID for user with active subscription', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: 'clerk_123' })
      ;(currentUser as jest.Mock).mockResolvedValue({
        id: 'clerk_123',
        publicMetadata: {},
      })

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_123',
        clerkId: 'clerk_123',
        subscription: {
          id: 'sub_123',
          accessLevel: 'PAID',
          status: 'ACTIVE',
          plan: 'monthly',
          currentPeriodEnd: new Date('2026-02-28'),
          isEarlyAdopter: true,
        },
      })

      const access = await accessModule.getAccess()

      expect(access.level).toBe('PAID')
      expect(access.isPaid).toBe(true)
      expect(access.canCreateDecision).toBe(true)
      expect(access.subscription?.isEarlyAdopter).toBe(true)
    })

    it('should return FREE_PREVIEW for user with expired subscription', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: 'clerk_123' })
      ;(currentUser as jest.Mock).mockResolvedValue({
        id: 'clerk_123',
        publicMetadata: {},
      })

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_123',
        clerkId: 'clerk_123',
        subscription: {
          id: 'sub_123',
          accessLevel: 'PAID',
          status: 'EXPIRED', // Expired!
          plan: 'monthly',
        },
      })

      const access = await accessModule.getAccess()

      expect(access.level).toBe('FREE_PREVIEW')
      expect(access.isPaid).toBe(false)
    })
  })

  describe('upgradeUserToPaid', () => {
    it('should create subscription with PAID access level', async () => {
      const userId = 'user_123'
      const stripeData = {
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        priceId: 'price_123',
        plan: 'monthly' as const,
        amount: 2900,
        periodEnd: new Date('2026-02-28'),
      }

      prismaMock.subscription.upsert.mockResolvedValue({
        id: 'sub_db_123',
        userId,
        accessLevel: 'PAID',
        status: 'ACTIVE',
        ...stripeData,
      })

      await accessModule.upgradeUserToPaid(userId, stripeData)

      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: expect.objectContaining({
          userId,
          accessLevel: 'PAID',
          status: 'ACTIVE',
          isEarlyAdopter: true,
        }),
        update: expect.objectContaining({
          accessLevel: 'PAID',
          status: 'ACTIVE',
        }),
      })
    })
  })

  describe('downgradeUser', () => {
    it('should set access level to FREE_PREVIEW and status to EXPIRED', async () => {
      const userId = 'user_123'

      prismaMock.subscription.update.mockResolvedValue({
        id: 'sub_123',
        userId,
        accessLevel: 'FREE_PREVIEW',
        status: 'EXPIRED',
      })

      await accessModule.downgradeUser(userId)

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          accessLevel: 'FREE_PREVIEW',
          status: 'EXPIRED',
        },
      })
    })
  })

  describe('AccessError', () => {
    it('should create error with correct code and message', () => {
      const error = new accessModule.AccessError('payment_required', 'Abonnement requis')

      expect(error.code).toBe('payment_required')
      expect(error.message).toBe('Abonnement requis')
      expect(error.name).toBe('AccessError')
    })
  })
})

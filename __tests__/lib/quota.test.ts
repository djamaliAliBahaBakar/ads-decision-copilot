/**
 * Tests for the freemium quota system
 *
 * Critical business logic:
 * - FREE users: 3 decisions max
 * - PAID users: unlimited decisions
 * - SUPERUSER: unlimited decisions
 */

import { prismaMock } from '../mocks/prisma'

// Mock the modules before importing
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

jest.mock('@/lib/get-or-create-user', () => ({
  getOrCreateUser: jest.fn(),
}))

jest.mock('@/lib/access', () => ({
  getAccess: jest.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { getAccess } from '@/lib/access'

// We need to import after mocking
const decisionsModule = require('@/app/actions/decisions')

describe('Quota System', () => {
  const mockUser = {
    id: 'user_123',
    clerkId: 'clerk_123',
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getOrCreateUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('getDecisionQuota', () => {
    it('should return unlimited quota for PAID users', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'PAID',
        isPaid: true,
        isSuperuser: false,
      })

      const quota = await decisionsModule.getDecisionQuota()

      expect(quota.isPaid).toBe(true)
      expect(quota.remaining).toBe(Infinity)
    })

    it('should return unlimited quota for SUPERUSER', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'SUPERUSER',
        isPaid: true,
        isSuperuser: true,
      })

      const quota = await decisionsModule.getDecisionQuota()

      expect(quota.isPaid).toBe(true)
      expect(quota.remaining).toBe(Infinity)
    })

    it('should return 3 free decisions for FREE users with 0 used', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'FREE_PREVIEW',
        isPaid: false,
        isSuperuser: false,
      })

      prismaMock.decision.count.mockResolvedValue(0)

      const quota = await decisionsModule.getDecisionQuota()

      expect(quota.isPaid).toBe(false)
      expect(quota.used).toBe(0)
      expect(quota.limit).toBe(3)
      expect(quota.remaining).toBe(3)
    })

    it('should return 1 remaining for FREE user with 2 decisions', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'FREE_PREVIEW',
        isPaid: false,
        isSuperuser: false,
      })

      prismaMock.decision.count.mockResolvedValue(2)

      const quota = await decisionsModule.getDecisionQuota()

      expect(quota.isPaid).toBe(false)
      expect(quota.used).toBe(2)
      expect(quota.remaining).toBe(1)
    })

    it('should return 0 remaining for FREE user with 3+ decisions', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'FREE_PREVIEW',
        isPaid: false,
        isSuperuser: false,
      })

      prismaMock.decision.count.mockResolvedValue(3)

      const quota = await decisionsModule.getDecisionQuota()

      expect(quota.isPaid).toBe(false)
      expect(quota.used).toBe(3)
      expect(quota.remaining).toBe(0)
    })
  })

  describe('logDecision - Freemium enforcement', () => {
    const mockAd = {
      id: 'ad_123',
      adName: 'Test Ad',
      cpl: 10.5,
      spend: 100,
      leads: 10,
    }

    const mockDecisionData = {
      adId: 'ad_123',
      action: 'KILL',
      reason: 'CPL too high',
      notes: '',
      confidence: 80,
    }

    it('should allow decision for PAID user regardless of count', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'PAID',
        isPaid: true,
        isSuperuser: false,
      })

      prismaMock.ad.findUnique.mockResolvedValue(mockAd)
      prismaMock.decision.create.mockResolvedValue({
        id: 'decision_123',
        ...mockDecisionData,
        userId: mockUser.id,
      })
      prismaMock.userRule.findMany.mockResolvedValue([])
      prismaMock.decision.update.mockResolvedValue({})

      const result = await decisionsModule.logDecision(mockDecisionData)

      expect(result.id).toBe('decision_123')
      expect(prismaMock.decision.count).not.toHaveBeenCalled()
    })

    it('should allow decision for FREE user with < 3 decisions', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'FREE_PREVIEW',
        isPaid: false,
        isSuperuser: false,
      })

      prismaMock.decision.count.mockResolvedValue(2) // Has 2, can create 1 more
      prismaMock.ad.findUnique.mockResolvedValue(mockAd)
      prismaMock.decision.create.mockResolvedValue({
        id: 'decision_123',
        ...mockDecisionData,
        userId: mockUser.id,
      })
      prismaMock.userRule.findMany.mockResolvedValue([])
      prismaMock.decision.update.mockResolvedValue({})

      const result = await decisionsModule.logDecision(mockDecisionData)

      expect(result.id).toBe('decision_123')
    })

    it('should BLOCK decision for FREE user with >= 3 decisions', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'FREE_PREVIEW',
        isPaid: false,
        isSuperuser: false,
      })

      prismaMock.decision.count.mockResolvedValue(3) // Already at limit

      await expect(decisionsModule.logDecision(mockDecisionData)).rejects.toThrow(
        /limite de 3 décisions gratuites/
      )
    })

    it('should include upgrade message in error for blocked FREE user', async () => {
      ;(getAccess as jest.Mock).mockResolvedValue({
        level: 'FREE_PREVIEW',
        isPaid: false,
        isSuperuser: false,
      })

      prismaMock.decision.count.mockResolvedValue(5) // Way over limit

      await expect(decisionsModule.logDecision(mockDecisionData)).rejects.toThrow(
        /version payante/
      )
    })
  })
})

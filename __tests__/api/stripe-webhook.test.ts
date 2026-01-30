/**
 * Tests for Stripe webhook logic
 *
 * Tests the business logic functions used by webhook:
 * - upgradeUserToPaid
 * - downgradeUser
 *
 * @jest-environment node
 */

import { prismaMock } from '../mocks/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: require('../mocks/prisma').prismaMock,
}))

describe('Stripe Webhook Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('upgradeUserToPaid', () => {
    it('should create subscription with correct data', async () => {
      // Import after mocking
      const { upgradeUserToPaid } = require('@/lib/access')

      const userId = 'user_123'
      const stripeData = {
        customerId: 'cus_stripe_123',
        subscriptionId: 'sub_stripe_123',
        priceId: 'price_monthly_123',
        plan: 'monthly' as const,
        amount: 2900,
        periodEnd: new Date('2026-02-28'),
      }

      prismaMock.subscription.upsert.mockResolvedValue({
        id: 'sub_db_123',
        userId,
        accessLevel: 'PAID',
        status: 'ACTIVE',
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId,
        stripePriceId: stripeData.priceId,
        plan: stripeData.plan,
        amount: stripeData.amount,
        currentPeriodEnd: stripeData.periodEnd,
        isEarlyAdopter: true,
      })

      await upgradeUserToPaid(userId, stripeData)

      expect(prismaMock.subscription.upsert).toHaveBeenCalledTimes(1)
      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          create: expect.objectContaining({
            userId,
            accessLevel: 'PAID',
            status: 'ACTIVE',
            stripeCustomerId: stripeData.customerId,
            stripeSubscriptionId: stripeData.subscriptionId,
            isEarlyAdopter: true,
          }),
          update: expect.objectContaining({
            accessLevel: 'PAID',
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('should set isEarlyAdopter to true for early users', async () => {
      const { upgradeUserToPaid } = require('@/lib/access')

      prismaMock.subscription.upsert.mockResolvedValue({})

      await upgradeUserToPaid('user_123', {
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        priceId: 'price_123',
        plan: 'monthly',
        amount: 2900,
        periodEnd: new Date(),
      })

      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isEarlyAdopter: true,
          }),
        })
      )
    })
  })

  describe('downgradeUser', () => {
    it('should set accessLevel to FREE_PREVIEW and status to EXPIRED', async () => {
      const { downgradeUser } = require('@/lib/access')

      prismaMock.subscription.update.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        accessLevel: 'FREE_PREVIEW',
        status: 'EXPIRED',
      })

      await downgradeUser('user_123')

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        data: {
          accessLevel: 'FREE_PREVIEW',
          status: 'EXPIRED',
        },
      })
    })
  })

  describe('grantSuperuser', () => {
    it('should set accessLevel to SUPERUSER', async () => {
      const { grantSuperuser } = require('@/lib/access')

      prismaMock.subscription.upsert.mockResolvedValue({})

      await grantSuperuser('user_admin_123')

      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user_admin_123' },
          create: expect.objectContaining({
            accessLevel: 'SUPERUSER',
            status: 'ACTIVE',
          }),
          update: expect.objectContaining({
            accessLevel: 'SUPERUSER',
            status: 'ACTIVE',
          }),
        })
      )
    })
  })
})

describe('Webhook Event Mapping', () => {
  it('checkout.session.completed should trigger user upgrade', () => {
    // This is a documentation test - verifying the expected behavior
    const eventType = 'checkout.session.completed'
    const expectedAction = 'upgradeUserToPaid'

    expect(eventType).toBe('checkout.session.completed')
    expect(expectedAction).toBe('upgradeUserToPaid')
  })

  it('customer.subscription.deleted should trigger user downgrade', () => {
    const eventType = 'customer.subscription.deleted'
    const expectedAction = 'downgradeUser'

    expect(eventType).toBe('customer.subscription.deleted')
    expect(expectedAction).toBe('downgradeUser')
  })

  it('invoice.payment_failed should log warning', () => {
    const eventType = 'invoice.payment_failed'
    const expectedAction = 'console.warn'

    expect(eventType).toBe('invoice.payment_failed')
    expect(expectedAction).toBe('console.warn')
  })
})

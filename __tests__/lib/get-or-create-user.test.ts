/**
 * Tests for getOrCreateUser - Beta user auto-assignment
 *
 * The first 10 users get free PAID access for 3 months.
 */

import { prismaMock } from '../mocks/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'

const { getOrCreateUser } = require('@/lib/get-or-create-user')

describe('getOrCreateUser - Beta assignment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ userId: 'clerk_new' })
    ;(currentUser as jest.Mock).mockResolvedValue({
      id: 'clerk_new',
      emailAddresses: [{ emailAddress: 'new@example.com' }],
    })
  })

  it('should create beta subscription for user when total count <= 10', async () => {
    const createdUser = {
      id: 'user_new',
      clerkId: 'clerk_new',
      email: 'new@example.com',
      isBetaUser: false,
    }

    // User does not exist yet
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(createdUser)
    prismaMock.user.count.mockResolvedValue(5)
    prismaMock.user.update.mockResolvedValue({ ...createdUser, isBetaUser: true })
    prismaMock.subscription.create.mockResolvedValue({
      id: 'sub_beta',
      userId: 'user_new',
      accessLevel: 'PAID',
      status: 'ACTIVE',
      plan: 'beta_free',
    })

    await getOrCreateUser()

    expect(prismaMock.user.count).toHaveBeenCalled()
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_new' },
        data: expect.objectContaining({
          isBetaUser: true,
          betaAccessExpiresAt: expect.any(Date),
        }),
      })
    )
    expect(prismaMock.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_new',
          accessLevel: 'PAID',
          status: 'ACTIVE',
          plan: 'beta_free',
          isEarlyAdopter: true,
        }),
      })
    )
  })

  it('should NOT create beta subscription when total users > 10', async () => {
    const createdUser = {
      id: 'user_11',
      clerkId: 'clerk_new',
      email: 'new@example.com',
      isBetaUser: false,
    }

    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(createdUser)
    prismaMock.user.count.mockResolvedValue(11)

    await getOrCreateUser()

    expect(prismaMock.user.count).toHaveBeenCalled()
    expect(prismaMock.subscription.create).not.toHaveBeenCalled()
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('should not modify existing user subscription on login', async () => {
    const existingUser = {
      id: 'user_existing',
      clerkId: 'clerk_new',
      email: 'existing@example.com',
      isBetaUser: true,
    }

    // User already exists
    prismaMock.user.findUnique.mockResolvedValue(existingUser)

    await getOrCreateUser()

    expect(prismaMock.user.count).not.toHaveBeenCalled()
    expect(prismaMock.subscription.create).not.toHaveBeenCalled()
  })

  it('should set betaAccessExpiresAt to approximately 3 months from now', async () => {
    const createdUser = {
      id: 'user_first',
      clerkId: 'clerk_new',
      email: 'new@example.com',
      isBetaUser: false,
    }

    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(createdUser)
    prismaMock.user.count.mockResolvedValue(1)
    prismaMock.user.update.mockResolvedValue({ ...createdUser, isBetaUser: true })
    prismaMock.subscription.create.mockResolvedValue({})

    await getOrCreateUser()

    const updateCall = prismaMock.user.update.mock.calls[0][0]
    const expiresAt = updateCall.data.betaAccessExpiresAt as Date
    const now = new Date()
    const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    // Should be between 88 and 93 days (~3 months, with margin for test execution time)
    expect(diffDays).toBeGreaterThanOrEqual(88)
    expect(diffDays).toBeLessThanOrEqual(93)
  })
})

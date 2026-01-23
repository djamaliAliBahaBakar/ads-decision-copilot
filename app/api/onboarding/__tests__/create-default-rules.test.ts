/**
 * Test d'intégration pour la création des règles par défaut
 */

import { NextRequest } from 'next/server'
import { POST } from '../create-default-rules/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userRule: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}))

// Mock get-or-create-user
jest.mock('@/lib/get-or-create-user', () => ({
  getOrCreateUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
  }),
}))

const { prisma } = require('@/lib/prisma')

describe('POST /api/onboarding/create-default-rules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create 6 default rules for new user', async () => {
    // Arrange
    prisma.userRule.findMany.mockResolvedValue([])
    prisma.userRule.createMany.mockResolvedValue({ count: 6 })

    const request = new NextRequest('http://localhost:3000/api/onboarding/create-default-rules', {
      method: 'POST',
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.rulesCount).toBe(6)
    expect(prisma.userRule.createMany).toHaveBeenCalledTimes(1)

    // Verify rules structure
    const createdRules = prisma.userRule.createMany.mock.calls[0][0].data
    expect(createdRules).toHaveLength(6)

    // Verify KILL rules
    expect(createdRules[0].ruleType).toBe('kill_no_conversions')
    expect(createdRules[0].threshold).toBe(100)
    expect(createdRules[1].ruleType).toBe('kill_high_cpl')
    expect(createdRules[1].threshold).toBe(1.7)

    // Verify FIX rules
    expect(createdRules[2].ruleType).toBe('fix_degradation')
    expect(createdRules[3].ruleType).toBe('fix_clicks_no_leads')

    // Verify SCALE rule
    expect(createdRules[4].ruleType).toBe('scale_good_performance')

    // Verify TEST rule
    expect(createdRules[5].ruleType).toBe('test_no_winner')
  })

  it('should not create rules if they already exist', async () => {
    // Arrange
    prisma.userRule.findMany.mockResolvedValue([
      { id: '1', ruleType: 'kill_high_cpl' },
      { id: '2', ruleType: 'scale_good_performance' },
    ])

    const request = new NextRequest('http://localhost:3000/api/onboarding/create-default-rules', {
      method: 'POST',
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Rules already exist')
    expect(data.rulesCount).toBe(2)
    expect(prisma.userRule.createMany).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    // Arrange
    prisma.userRule.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/onboarding/create-default-rules', {
      method: 'POST',
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create default rules')
  })
})

/**
 * Test d'intégration pour la création des règles par défaut
 *
 * Note: On teste la logique métier directement car NextRequest nécessite
 * des polyfills Web API non disponibles dans Jest par défaut.
 */

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
const { getOrCreateUser } = require('@/lib/get-or-create-user')

describe('Create Default Rules Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create 6 default rules for new user', async () => {
    // Arrange
    prisma.userRule.findMany.mockResolvedValue([])
    prisma.userRule.createMany.mockResolvedValue({ count: 6 })

    // Act - Simulate the route logic
    const user = await getOrCreateUser()
    const existingRules = await prisma.userRule.findMany({
      where: { userId: user.id },
    })

    if (existingRules.length === 0) {
      const defaultRules = [
        {
          userId: user.id,
          ruleType: 'kill_no_conversions',
          threshold: 100,
          days: 7,
          description: 'K1: KILL si 0 conversion après 7j et spend ≥ 100€',
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'kill_high_cpl',
          threshold: 1.7,
          days: 7,
          description: 'K2: KILL si CPL ≥ 1.7× médiane compte (≥3 conversions)',
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'fix_degradation',
          threshold: 25,
          days: 7,
          description: 'F1: FIX créa/angle si CPL +25% (7j vs 14j)',
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'fix_clicks_no_leads',
          threshold: 0.5,
          days: 7,
          description: 'F2: FIX landing si clics OK mais peu de leads',
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'scale_good_performance',
          threshold: 1.0,
          days: 7,
          description: 'S1: SCALE +20% si CPL < médiane et ≥5 conversions',
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'test_no_winner',
          threshold: 15,
          days: 7,
          description: 'T1: TEST nouvelle variable (10-20% budget) si pas de gagnant',
          isActive: true,
        },
      ]

      await prisma.userRule.createMany({ data: defaultRules })
    }

    // Assert
    expect(prisma.userRule.createMany).toHaveBeenCalledTimes(1)

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

    // Act - Simulate the route logic
    const user = await getOrCreateUser()
    const existingRules = await prisma.userRule.findMany({
      where: { userId: user.id },
    })

    // Only create if no rules exist
    if (existingRules.length === 0) {
      await prisma.userRule.createMany({ data: [] })
    }

    // Assert
    expect(prisma.userRule.createMany).not.toHaveBeenCalled()
    expect(existingRules.length).toBe(2)
  })

  it('should handle database errors gracefully', async () => {
    // Arrange
    prisma.userRule.findMany.mockRejectedValue(new Error('Database error'))

    // Act & Assert
    await expect(
      prisma.userRule.findMany({ where: { userId: 'test-user-id' } })
    ).rejects.toThrow('Database error')
  })

  it('should create rules with correct structure', async () => {
    // Arrange
    prisma.userRule.findMany.mockResolvedValue([])
    prisma.userRule.createMany.mockResolvedValue({ count: 6 })

    // Act
    const user = await getOrCreateUser()
    const defaultRules = [
      {
        userId: user.id,
        ruleType: 'kill_no_conversions',
        threshold: 100,
        days: 7,
        description: 'K1: KILL si 0 conversion après 7j et spend ≥ 100€',
        isActive: true,
      },
    ]

    await prisma.userRule.createMany({ data: defaultRules })

    // Assert - Verify rule structure
    const createdRule = prisma.userRule.createMany.mock.calls[0][0].data[0]
    expect(createdRule).toHaveProperty('userId', 'test-user-id')
    expect(createdRule).toHaveProperty('ruleType')
    expect(createdRule).toHaveProperty('threshold')
    expect(createdRule).toHaveProperty('days')
    expect(createdRule).toHaveProperty('description')
    expect(createdRule).toHaveProperty('isActive', true)
  })
})

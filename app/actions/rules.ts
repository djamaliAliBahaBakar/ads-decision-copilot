'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getUserRules() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return await prisma.userRule.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createUserRule(data: {
  ruleType: string
  threshold: number
  days: number
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return await prisma.userRule.create({
    data: {
      userId: user.id,
      ruleType: data.ruleType,
      threshold: data.threshold,
      days: data.days,
      isActive: true,
    },
  })
}

export async function deleteUserRule(ruleId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return await prisma.userRule.delete({
    where: { id: ruleId },
  })
}

// === TILTMETER FUNCTIONS ===

export async function calculateDisciplineScore() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const decisions = await prisma.decision.findMany({
    where: { userId: user.id },
    include: { ad: true },
  })

  const rules = await prisma.userRule.findMany({
    where: { userId: user.id, isActive: true },
  })

  if (decisions.length === 0) {
    return { score: 0, followed: 0, total: 0, percentage: 0 }
  }

  let followed = 0
  let applicable = 0

  decisions.forEach((decision) => {
    const applicableRules = rules.filter((rule) => {
      return checkIfRuleApplies(decision, rule)
    })

    if (applicableRules.length > 0) {
      applicable++
      // Check if user followed at least one applicable rule
      const didFollow = applicableRules.some((rule) => {
        return checkIfUserFollowedRule(decision, rule)
      })
      if (didFollow) {
        followed++
      }
    }
  })

  const percentage = applicable > 0 ? Math.round((followed / applicable) * 100) : 0

  return {
    score: applicable > 0 ? followed / applicable : 0,
    followed,
    total: applicable,
    percentage,
  }
}

// Check if a rule applies to a decision
function checkIfRuleApplies(decision: any, rule: any): boolean {
  const { ruleType, threshold, days } = rule
  const { cplAtDecision, cplTrend3d, daysRunning, action } = decision

  switch (ruleType) {
    case 'kill_if_cpl_high':
      // Kill si CPL > threshold pendant X jours
      return (
        cplAtDecision !== null &&
        cplAtDecision > threshold &&
        daysRunning !== null &&
        daysRunning >= days
      )

    case 'scale_if_roas_good':
      // Scale si performance stable pendant X jours
      return daysRunning !== null && daysRunning >= days

    case 'hold_if_learning':
      // Hold si < X jours
      return daysRunning !== null && daysRunning < days

    default:
      return false
  }
}

// Check if user followed a specific rule
function checkIfUserFollowedRule(decision: any, rule: any): boolean {
  const { ruleType, days } = rule
  const { cplAtDecision, daysRunning, action } = decision

  switch (ruleType) {
    case 'kill_if_cpl_high':
      // User should have KILLed
      return action === 'KILL'

    case 'scale_if_roas_good':
      // User should have SCALEd
      return action === 'SCALE'

    case 'hold_if_learning':
      // User should have HOLDed (hold ou test ok)
      return action === 'HOLD' || action === 'TEST'

    default:
      return false
  }
}
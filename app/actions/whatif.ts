'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/get-or-create-user'

interface WhatIfResult {
  actualScenario: {
    day: number
    spend: number
    leads: number
    cpl: number
  }
  whatIfScenario: {
    day: number
    spend: number
    leads: number
    cpl: number
  }
  savings: number
  lesson: string
  impact: string
}

export async function calculateWhatIf(
  decisionId: string,
  killDayHypothetical: number
): Promise<WhatIfResult> {
const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  // Get decision
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { ad: true },
  })

  if (!decision) {
    throw new Error('Decision not found')
  }

  // Check if user owns this decision
  if (decision.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  // Get all ads with same name from decision date onwards
  const adMetrics = await prisma.ad.findMany({
    where: {
      userId: user.id,
      adName: decision.ad.adName,
      date: { gte: decision.createdAt },
    },
    orderBy: { date: 'asc' },
  })

  if (adMetrics.length === 0) {
    throw new Error('No ad metrics found')
  }

  // Calculate actual (what user did)
  const killDayActual = adMetrics.length // How many days ad ran
  const actualData = adMetrics.slice(0, killDayActual)
  const actualSpend = actualData.reduce((sum, a) => sum + a.spend, 0)
  const actualLeads = actualData.reduce((sum, a) => sum + a.leads, 0)
  const actualCpl = actualLeads > 0 ? actualSpend / actualLeads : 0

  // Calculate what-if (if user had killed earlier)
  const whatIfData = adMetrics.slice(0, killDayHypothetical)
  const whatIfSpend = whatIfData.reduce((sum, a) => sum + a.spend, 0)
  const whatIfLeads = whatIfData.reduce((sum, a) => sum + a.leads, 0)
  const whatIfCpl = whatIfLeads > 0 ? whatIfSpend / whatIfLeads : 0

  // Calculate savings
  const spendSaved = actualSpend - whatIfSpend
  const leadsSaved = actualLeads - whatIfLeads
  const daysSaved = killDayActual - killDayHypothetical

  // Lesson
  let lesson = ''
  let impact = ''

  if (spendSaved > 100) {
    lesson = `Tu aurais économisé €${spendSaved.toFixed(0)} en tuant ${daysSaved} jours plus tôt`
    impact = `Mauvais timing (-€${spendSaved.toFixed(0)})`
  } else if (spendSaved < -100) {
    lesson = `Tu aurais dépensé €${Math.abs(spendSaved).toFixed(0)} de plus (timing trop agressif)`
    impact = `Bon timing (+€${Math.abs(spendSaved).toFixed(0)} économisés)`
  } else {
    lesson = `Le timing était correct (variance < €100)`
    impact = `Timing optimal`
  }

  return {
    actualScenario: {
      day: killDayActual,
      spend: actualSpend,
      leads: actualLeads,
      cpl: actualCpl,
    },
    whatIfScenario: {
      day: killDayHypothetical,
      spend: whatIfSpend,
      leads: whatIfLeads,
      cpl: whatIfCpl,
    },
    savings: spendSaved,
    lesson,
    impact,
  }
}
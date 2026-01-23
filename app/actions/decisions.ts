'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/get-or-create-user'

// 👇 FONCTION 1
export async function getDecisionSuggestions() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  const rules = await prisma.userRule.findMany({
    where: { userId: user.id, isActive: true },
  })

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const ads = await prisma.ad.findMany({
    where: {
      userId: user.id,
      date: { gte: fourteenDaysAgo },
    },
    orderBy: { date: 'desc' },
  })

  const adsMap = new Map()
  ads.forEach(ad => {
    const key = ad.adName
    if (!adsMap.has(key)) {
      adsMap.set(key, ad)
    }
  })

  const suggestions = Array.from(adsMap.values()).map(ad => {
    const adAds = ads.filter(a => a.adName === ad.adName)
    const daysRunning = adAds.length

    const last3Days = adAds.slice(0, 3)
    const prev3Days = adAds.slice(3, 6)

    const last3Cpl =
      last3Days.length > 0
        ? last3Days.reduce((sum, a) => sum + a.spend, 0) /
          last3Days.reduce((sum, a) => sum + a.leads, 0)
        : ad.cpl

    const prev3Cpl =
      prev3Days.length > 0
        ? prev3Days.reduce((sum, a) => sum + a.spend, 0) /
          prev3Days.reduce((sum, a) => sum + a.leads, 0)
        : last3Cpl

    const cplTrend3d = ((last3Cpl - prev3Cpl) / prev3Cpl) * 100

    let action = 'REVIEW'
    let confidence = 'LOW'
    let reason = 'No rule matched'

    rules.forEach(rule => {
      if (rule.ruleType === 'kill_if_cpl' && last3Cpl > rule.threshold && daysRunning >= rule.days) {
        action = 'KILL'
        confidence = 'HIGH'
        reason = `CPL €${last3Cpl.toFixed(2)} > €${rule.threshold} pendant ${daysRunning}j`
      }

      if (rule.ruleType === 'scale_if_roas' && ad.roas && ad.roas > rule.threshold && daysRunning >= rule.days) {
        action = 'SCALE'
        confidence = 'MEDIUM'
        reason = `ROAS ${ad.roas.toFixed(2)}x > ${rule.threshold}x`
      }
    })

    if (action === 'REVIEW') {
      if (cplTrend3d > 40 && daysRunning >= 3) {
        action = 'KILL'
        confidence = 'HIGH'
        reason = `CPL +${cplTrend3d.toFixed(1)}% en 3j`
      } else if (ad.roas && ad.roas > 3 && cplTrend3d < 10) {
        action = 'SCALE'
        confidence = 'MEDIUM'
        reason = `ROAS ${ad.roas.toFixed(2)}x stable`
      } else if (daysRunning < 3) {
        action = 'HOLD'
        confidence = 'LOW'
        reason = 'Phase learning (<3j)'
      }
    }

    return {
      id: ad.id,
      adName: ad.adName,
      campaignName: ad.campaignName,
      angle: ad.angle,
      cpl: last3Cpl,
      spend: ad.spend,
      leads: ad.leads,
      cplTrend3d,
      daysRunning,
      action,
      confidence,
      reason,
    }
  })

  return suggestions
}

// 👇 HELPERS (avant logDecision)
function checkIfRuleAppliesToDecision(decision: any, rule: any): boolean {
  const { ruleType, threshold, days } = rule
  const { cplAtDecision, daysRunning, action } = decision

  switch (ruleType) {
    case 'kill_if_cpl':  // ✅ changé de kill_if_cpl_high
      return cplAtDecision > threshold && daysRunning >= days
    case 'scale_if_roas':  // ✅ changé de scale_if_roas_good
      return daysRunning >= days
    case 'hold_if_learning':
      return daysRunning < days
    default:
      return false
  }
}

function checkIfUserFollowedRule(decision: any, rule: any): boolean {
  const { ruleType } = rule
  const { action } = decision

  switch (ruleType) {
    case 'kill_if_cpl':  // ✅ changé
      return action === 'KILL'
    case 'scale_if_roas':  // ✅ changé
      return action === 'SCALE'
    case 'hold_if_learning':
      return action === 'HOLD' || action === 'TEST'
    default:
      return false
  }
}
// 👇 FONCTION 2 (CORRIGÉE)
export async function logDecision(data: {
  adId: string
  action: string
  reason: string
  notes: string
  confidence: number
}) {
 const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  const ad = await prisma.ad.findUnique({
    where: { id: data.adId },
  })

  if (!ad) {
    throw new Error('Ad not found')
  }

  // CREATE decision
  const newDecision = await prisma.decision.create({
    data: {
      userId: user.id,
      adId: data.adId,
      action: data.action,
      reason: data.reason,
      cplAtDecision: ad.cpl,
      cplTrend3d: 0,
      daysRunning: 0,
      confidence: data.confidence,
    },
  })

  // === TILTMETER: Track si user a suivi ses règles ===
  const rules = await prisma.userRule.findMany({
    where: { userId: user.id, isActive: true },
  })

  let followedRule = false
  let appliedRuleId: string | null = null

  for (const rule of rules) {
    if (checkIfRuleAppliesToDecision(newDecision, rule)) {
      appliedRuleId = rule.id
      followedRule = checkIfUserFollowedRule(newDecision, rule)
      break // Only track first applicable rule
    }
  }

  // Update decision avec follow status
  await prisma.decision.update({
    where: { id: newDecision.id },
    data: {
      followedRule,
      appliedRuleId,
    },
  })

  return newDecision
}

// 👇 FONCTION 3
export async function getDecisionsForAds() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  return await prisma.decision.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: fourteenDaysAgo },
    },
    include: { ad: true },
  })
}

// 👇 FONCTION 4
export async function getAllDecisions() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  const decisions = await prisma.decision.findMany({
    where: { userId: user.id },
    include: { ad: true },
    orderBy: { createdAt: 'desc' },
  })

  return decisions.map(d => ({
    id: d.id,
    adId: d.adId,
    adName: d.ad.adName,
    angle: d.ad.angle,
    action: d.action,
    reason: d.reason,
    cplAtDecision: d.cplAtDecision,
    confidence: d.confidence,
    createdAt: d.createdAt,
    actualSavings: d.actualSavings,
    wasCorrect: d.wasCorrect,
    postMortemNotes: d.postMortemNotes,
    followedRule: d.followedRule,
    appliedRuleId: d.appliedRuleId,
  }))
}
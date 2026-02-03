'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { getAccess } from '@/lib/access'

// Nombre de décisions gratuites pour les utilisateurs FREE
const FREE_DECISIONS_LIMIT = 3

// 👇 FONCTION 1
export async function getDecisionSuggestions() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  const rules = await prisma.userRule.findMany({
    where: { userId: user.id, isActive: true },
  })

  // Récupérer TOUTES les données (supporte les imports agrégés)
  const ads = await prisma.ad.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { date: 'desc' },
  })

  // Grouper par nom de pub
  const adsMap = new Map<string, typeof ads>()
  ads.forEach(ad => {
    const key = ad.adName
    if (!adsMap.has(key)) {
      adsMap.set(key, [])
    }
    adsMap.get(key)!.push(ad)
  })

  // Détecter si données agrégées (1 ligne par pub = agrégé)
  const uniqueAdsCount = adsMap.size
  const totalLines = ads.length
  const isAggregatedData = uniqueAdsCount === totalLines

  // Calculer le CPL moyen global (pour comparaison relative)
  const totalSpend = ads.reduce((sum, a) => sum + a.spend, 0)
  const totalLeads = ads.reduce((sum, a) => sum + a.leads, 0)
  const avgCplGlobal = totalLeads > 0 ? totalSpend / totalLeads : 0

  const suggestions = Array.from(adsMap.entries()).map(([, adAds]) => {
    const ad = adAds[0] // La plus récente (triée par date desc)
    const daysRunning = adAds.length

    // Calculer le CPL de cette pub
    const adTotalSpend = adAds.reduce((sum, a) => sum + a.spend, 0)
    const adTotalLeads = adAds.reduce((sum, a) => sum + a.leads, 0)
    const adCpl = adTotalLeads > 0 ? adTotalSpend / adTotalLeads : ad.cpl

    // Tendance CPL (seulement si données quotidiennes)
    let cplTrend3d = 0
    if (!isAggregatedData && adAds.length >= 3) {
      const last3Days = adAds.slice(0, 3)
      const prev3Days = adAds.slice(3, 6)

      const last3Cpl = last3Days.reduce((sum, a) => sum + a.spend, 0) /
        Math.max(1, last3Days.reduce((sum, a) => sum + a.leads, 0))

      const prev3Cpl = prev3Days.length > 0
        ? prev3Days.reduce((sum, a) => sum + a.spend, 0) /
          Math.max(1, prev3Days.reduce((sum, a) => sum + a.leads, 0))
        : last3Cpl

      cplTrend3d = prev3Cpl > 0 ? ((last3Cpl - prev3Cpl) / prev3Cpl) * 100 : 0
    }

    let action: 'KILL' | 'SCALE' | 'HOLD' | 'REVIEW' = 'REVIEW'
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    let reason = 'À analyser'

    // === RÈGLES UTILISATEUR ===
    rules.forEach(rule => {
      // Pour données agrégées : ignorer la condition "days"
      const meetsMinDays = isAggregatedData ? true : daysRunning >= rule.days

      if (rule.ruleType === 'kill_if_cpl' && adCpl > rule.threshold && meetsMinDays) {
        action = 'KILL'
        confidence = 'HIGH'
        reason = `CPL €${adCpl.toFixed(2)} > seuil €${rule.threshold}`
      }

      if (rule.ruleType === 'scale_if_roas' && ad.roas && ad.roas > rule.threshold && meetsMinDays) {
        action = 'SCALE'
        confidence = 'MEDIUM'
        reason = `ROAS ${ad.roas.toFixed(2)}x > ${rule.threshold}x`
      }
    })

    // === RÈGLES PAR DÉFAUT (si aucune règle utilisateur n'a matché) ===
    if (action === 'REVIEW') {
      if (isAggregatedData) {
        // Mode agrégé : comparer au CPL moyen global
        const cplRatio = avgCplGlobal > 0 ? adCpl / avgCplGlobal : 1

        if (cplRatio > 1.5) {
          // CPL 50% plus élevé que la moyenne
          action = 'KILL'
          confidence = 'HIGH'
          reason = `CPL €${adCpl.toFixed(2)} = ${Math.round(cplRatio * 100)}% de la moyenne (€${avgCplGlobal.toFixed(2)})`
        } else if (cplRatio < 0.7 && adTotalLeads >= 5) {
          // CPL 30% moins cher que la moyenne + volume suffisant
          action = 'SCALE'
          confidence = 'MEDIUM'
          reason = `CPL €${adCpl.toFixed(2)} = meilleur que la moyenne (€${avgCplGlobal.toFixed(2)})`
        } else {
          action = 'HOLD'
          confidence = 'LOW'
          reason = `CPL €${adCpl.toFixed(2)} proche de la moyenne`
        }
      } else {
        // Mode quotidien : utiliser les tendances
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
    }

    return {
      id: ad.id,
      adName: ad.adName,
      campaignName: ad.campaignName,
      angle: ad.angle,
      cpl: adCpl,
      spend: adTotalSpend,
      leads: adTotalLeads,
      cplTrend3d,
      daysRunning: isAggregatedData ? null : daysRunning, // null = données agrégées
      action,
      confidence,
      reason,
      isAggregatedData,
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
// 👇 FONCTION 2 - FREEMIUM: 3 décisions gratuites
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

  // ⚡ FREEMIUM CHECK: 3 décisions gratuites, puis paywall
  const access = await getAccess()

  if (!access?.isPaid) {
    // Compter les décisions existantes de l'utilisateur
    const existingDecisionsCount = await prisma.decision.count({
      where: { userId: user.id },
    })

    if (existingDecisionsCount >= FREE_DECISIONS_LIMIT) {
      throw new Error(
        `Vous avez atteint la limite de ${FREE_DECISIONS_LIMIT} décisions gratuites. ` +
        `Passez à la version payante pour des décisions illimitées.`
      )
    }
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
// 👇 FONCTION 4 - Get user's decision quota
export async function getDecisionQuota() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  const access = await getAccess()
  const isPaid = access?.isPaid ?? false

  if (isPaid) {
    return {
      isPaid: true,
      used: 0,
      limit: Infinity,
      remaining: Infinity,
    }
  }

  const usedCount = await prisma.decision.count({
    where: { userId: user.id },
  })

  return {
    isPaid: false,
    used: usedCount,
    limit: FREE_DECISIONS_LIMIT,
    remaining: Math.max(0, FREE_DECISIONS_LIMIT - usedCount),
  }
}

// 👇 FONCTION 5 - Get savings realized from decisions
export async function getRealizedSavings() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  // Get all KILL decisions (where we stopped spending on bad ads)
  const killDecisions = await prisma.decision.findMany({
    where: {
      userId: user.id,
      action: 'KILL',
    },
    include: { ad: true },
  })

  // Estimate savings: if CPL was X and we killed it, we saved ~60% of what we would have spent
  // We assume the ad would have run for 30 more days at the same daily spend
  const totalSavings = killDecisions.reduce((sum, decision) => {
    const dailySpend = decision.ad.spend / 14 // Average daily spend from 14-day data
    const projectedWaste = dailySpend * 30 * 0.6 // 30 days, 60% would be waste
    return sum + projectedWaste
  }, 0)

  // Get potential savings from ads not yet decided (danger status)
  const ads = await prisma.ad.findMany({
    where: {
      userId: user.id,
    },
  })

  // Group by ad name, get latest
  const adsMap = new Map()
  ads.forEach(ad => {
    if (!adsMap.has(ad.adName)) {
      adsMap.set(ad.adName, ad)
    }
  })

  // Calculate potential savings from high CPL ads not yet decided
  const decidedAdIds = new Set(killDecisions.map(d => d.adId))
  const potentialSavings = Array.from(adsMap.values())
    .filter(ad => !decidedAdIds.has(ad.id))
    .filter(ad => ad.cpl > 10) // High CPL threshold
    .reduce((sum, ad) => {
      const dailySpend = ad.spend / 14
      return sum + dailySpend * 30 * 0.6
    }, 0)

  return {
    realized: Math.round(totalSavings),
    potential: Math.round(potentialSavings),
    decisionsCount: killDecisions.length,
    adsToDecide: Array.from(adsMap.values()).filter(ad => !decidedAdIds.has(ad.id) && ad.cpl > 10).length,
  }
}

// 👇 FONCTION 6
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
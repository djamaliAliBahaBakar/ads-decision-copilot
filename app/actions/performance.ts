'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getPerformanceByAngle() {
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

  // Get all ads (no date limit for full picture)
  const ads = await prisma.ad.findMany({
    where: { userId: user.id },
  })

  if (ads.length === 0) {
    return { angleStats: [], insights: [] }
  }

  // Group by angle
  const groupedByAngle = new Map()

  ads.forEach(ad => {
    const angle = ad.angle || 'Unknown'
    if (!groupedByAngle.has(angle)) {
      groupedByAngle.set(angle, [])
    }
    groupedByAngle.get(angle).push(ad)
  })

  // Calculate stats per angle
  const angleStats = Array.from(groupedByAngle.entries()).map(([angle, angleAds]) => {
    const totalSpend = angleAds.reduce((sum, ad) => sum + ad.spend, 0)
    const totalLeads = angleAds.reduce((sum, ad) => sum + ad.leads, 0)
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0
    const avgRoas = angleAds.reduce((sum, ad) => sum + (ad.roas || 0), 0) / angleAds.length
    const bestCpl = Math.min(...angleAds.map(ad => ad.cpl))
    const worstCpl = Math.max(...angleAds.map(ad => ad.cpl))

    return {
      angle,
      avgCpl: parseFloat(avgCpl.toFixed(2)),
      avgRoas: parseFloat(avgRoas.toFixed(2)),
      adsCount: angleAds.length,
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      totalLeads,
      bestCpl: parseFloat(bestCpl.toFixed(2)),
      worstCpl: parseFloat(worstCpl.toFixed(2)),
    }
  })

  // Sort by CPL (best first)
  angleStats.sort((a, b) => a.avgCpl - b.avgCpl)

  // Generate insights
  const insights: Array<{ type: string; text: string }> = []

  if (angleStats.length >= 2) {
    const best = angleStats[0]
    const worst = angleStats[angleStats.length - 1]
    const ratio = (worst.avgCpl / best.avgCpl).toFixed(1)

    insights.push({
      type: 'comparison',
      text: `🎯 ${worst.angle} coûte ${ratio}x plus cher que ${best.angle} (€${worst.avgCpl.toFixed(2)} vs €${best.avgCpl.toFixed(2)})`,
    })

    const totalSpend = angleStats.reduce((sum, a) => sum + a.totalSpend, 0)
    const worstSpend = worst.totalSpend
    const potentialSavings = worstSpend * ((worst.avgCpl - best.avgCpl) / worst.avgCpl)

    insights.push({
      type: 'recommendation',
      text: `💰 En stoppant ${worst.angle}, tu économises €${potentialSavings.toFixed(0)}/mois`,
    })
  }

  const avgCplAll = angleStats.reduce((sum, a) => sum + a.avgCpl, 0) / angleStats.length
  const bestRoas = Math.max(...angleStats.map(a => a.avgRoas))
  const bestByRoas = angleStats.find(a => a.avgRoas === bestRoas)

  insights.push({
    type: 'best',
    text: `⭐ ${bestByRoas?.angle} performe le mieux : ROAS ${bestByRoas?.avgRoas.toFixed(2)}x`,
  })

  return {
    angleStats,
    insights,
  }
}
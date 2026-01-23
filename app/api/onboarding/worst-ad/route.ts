import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getOrCreateUser()

    // Récupérer les ads des 3 derniers jours
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentAds = await prisma.ad.findMany({
      where: {
        userId: user.id,
        date: { gte: threeDaysAgo },
      },
      select: {
        id: true,
        adName: true,
        cpl: true,
        spend: true,
        leads: true,
      },
      orderBy: { cpl: 'desc' },
    })

    if (recentAds.length === 0) {
      return NextResponse.json(null)
    }

    // Calculer médiane
    const allAds = await prisma.ad.findMany({
      where: { userId: user.id },
      select: { cpl: true },
    })

    const cpls = allAds.map(ad => ad.cpl).sort((a, b) => a - b)
    const medianCpl = cpls[Math.floor(cpls.length / 2)]

    // Pire ad = CPL le plus élevé
    const worstAd = recentAds[0]
    const percentAboveMedian = Math.round(((worstAd.cpl - medianCpl) / medianCpl) * 100)

    return NextResponse.json({
      id: worstAd.id,
      adName: worstAd.adName,
      cpl: worstAd.cpl,
      spend: worstAd.spend,
      leads: worstAd.leads,
      medianCpl,
      percentAboveMedian,
    })
  } catch (error) {
    console.error('Worst ad error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

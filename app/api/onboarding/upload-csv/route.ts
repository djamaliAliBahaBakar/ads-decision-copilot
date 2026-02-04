import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/get-or-create-user'

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()

    const { rows } = await req.json()

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid CSV data' },
        { status: 400 }
      )
    }

    // Supprimer les anciennes données (si onboarding re-fait)
    await prisma.ad.deleteMany({
      where: { userId: user.id },
    })

    // Créer les nouvelles entrées
    const adsToCreate = rows.map((row: any) => ({
      userId: user.id,
      adName: row.ad_name,
      campaignName: row.campaign_name || null,
      adSetName: row.ad_set_name || null,
      metaAdId: row.meta_ad_id || null,
      angle: row.angle || null,
      cpl: row.cpl,
      spend: row.spend,
      leads: row.leads,
      ctr: row.ctr || null,
      roas: row.roas || null,
      date: new Date(row.date),
      weekNumber: getWeekNumber(new Date(row.date)),
    }))

    await prisma.ad.createMany({
      data: adsToCreate,
    })

    // Calculer les stats pour l'écran de vérification
    const uniqueCampaigns = new Set(adsToCreate.map(a => a.campaignName).filter(Boolean))
    const uniqueAds = new Set(adsToCreate.map(a => a.adName))
    const minDate = new Date(Math.min(...adsToCreate.map(a => a.date.getTime())))
    const maxDate = new Date(Math.max(...adsToCreate.map(a => a.date.getTime())))

    // Warnings
    const warnings: string[] = []
    if (uniqueAds.size === 1) {
      warnings.push(
        '⚠️ Une seule pub détectée. AdsDecision compare vos pubs entre elles pour identifier les meilleures. ' +
        'Ajoutez plus de pubs pour profiter pleinement de l\'outil.'
      )
    }

    const stats = {
      count: adsToCreate.length,
      campaignsCount: uniqueCampaigns.size,
      uniqueAdsCount: uniqueAds.size,
      minDate: minDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      maxDate: maxDate.toISOString().split('T')[0],
      totalSpend: adsToCreate.reduce((sum, a) => sum + a.spend, 0),
      totalLeads: adsToCreate.reduce((sum, a) => sum + a.leads, 0),
      avgCpl: adsToCreate.reduce((sum, a) => sum + a.cpl, 0) / adsToCreate.length,
      warnings,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Upload CSV error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper pour calculer le numéro de semaine
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

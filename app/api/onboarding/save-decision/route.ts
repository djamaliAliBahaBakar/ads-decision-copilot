import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const { worstAd } = await req.json()

    if (!worstAd || !worstAd.id) {
      return NextResponse.json(
        { error: 'Invalid worst ad data' },
        { status: 400 }
      )
    }

    // Créer la décision exemple
    const decision = await prisma.decision.create({
      data: {
        userId: user.id,
        adId: worstAd.id,
        action: 'KILL',
        reason: `CPL supérieur de ${worstAd.percentAboveMedian}% à la médiane. Cette campagne dépense votre budget sans résultats proportionnels.`,
        hypothesis: 'Arrêter cette campagne permettra de réallouer le budget vers des campagnes plus performantes.',
        expectedEffect: `Économie estimée : €${(worstAd.spend * 0.3).toFixed(2)} par période similaire`,
        confidence: 4,
        cplAtDecision: worstAd.cpl,
        cplTrend3d: null,
        daysRunning: 3,
        followedRule: true,
        appliedRuleId: null,
      },
    })

    return NextResponse.json({ success: true, decisionId: decision.id })
  } catch (error) {
    console.error('Save decision error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

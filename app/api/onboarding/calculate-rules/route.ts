import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const { stats } = await req.json()

    // Récupérer toutes les ads de l'utilisateur
    const ads = await prisma.ad.findMany({
      where: { userId: user.id },
      select: { cpl: true },
    })

    if (ads.length === 0) {
      // Règles par défaut si pas de données
      return NextResponse.json([
        {
          type: 'kill_if_cpl',
          threshold: 15,
          days: 3,
          description: 'Kill si CPL > €15 pendant 3 jours',
          icon: '🔴',
        },
        {
          type: 'scale_if_cpl',
          threshold: 8,
          days: 3,
          description: 'Scale si CPL < €8 pendant 3 jours',
          icon: '📈',
        },
        {
          type: 'analysis_window',
          threshold: 7,
          days: 7,
          description: 'Fenêtre d\'analyse : 7 jours',
          icon: '⏱️',
        },
      ])
    }

    // Calculer la médiane du CPL
    const cpls = ads.map(ad => ad.cpl).sort((a, b) => a - b)
    const median = cpls[Math.floor(cpls.length / 2)]

    // Générer règles intelligentes
    const killThreshold = Math.round(median * 1.5 * 100) / 100
    const scaleThreshold = Math.round(median * 0.7 * 100) / 100

    const suggestedRules = [
      {
        type: 'kill_if_cpl',
        threshold: killThreshold,
        days: 3,
        description: `Kill si CPL > €${killThreshold} pendant 3 jours`,
        icon: '🔴',
      },
      {
        type: 'scale_if_cpl',
        threshold: scaleThreshold,
        days: 3,
        description: `Scale si CPL < €${scaleThreshold} pendant 3 jours`,
        icon: '📈',
      },
      {
        type: 'analysis_window',
        threshold: 7,
        days: 7,
        description: 'Fenêtre d\'analyse : 7 jours',
        icon: '⏱️',
      },
    ]

    return NextResponse.json(suggestedRules)
  } catch (error) {
    console.error('Calculate rules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

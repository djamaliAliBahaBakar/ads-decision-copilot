import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { prisma } from '@/lib/prisma'

/**
 * Crée des règles par défaut intelligentes pour le MVP
 * Appelé automatiquement à la fin de l'onboarding
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()

    // Vérifier si l'utilisateur a déjà des règles
    const existingRules = await prisma.userRule.findMany({
      where: { userId: user.id },
    })

    if (existingRules.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Rules already exist',
        rulesCount: existingRules.length,
      })
    }

    // Créer les règles par défaut professionnelles basées sur les hypothèses produit
    const defaultRules = [
      // 🔴 KILL — Arrêter ce qui gaspille
      {
        userId: user.id,
        ruleType: 'kill_no_conversions',
        threshold: 100, // Seuil de spend en €
        days: 7,
        description: 'K1: KILL si 0 conversion après 7j et spend ≥ 100€',
        isActive: true,
      },
      {
        userId: user.id,
        ruleType: 'kill_high_cpl',
        threshold: 1.7, // Multiple de la médiane
        days: 7,
        description: 'K2: KILL si CPL ≥ 1.7× médiane compte (≥3 conversions)',
        isActive: true,
      },

      // 🟠 FIX — Corriger sans tout casser
      {
        userId: user.id,
        ruleType: 'fix_degradation',
        threshold: 25, // % d'augmentation CPL
        days: 7,
        description: 'F1: FIX créa/angle si CPL +25% (7j vs 14j)',
        isActive: true,
      },
      {
        userId: user.id,
        ruleType: 'fix_clicks_no_leads',
        threshold: 0.5, // Taux de conversion minimum attendu
        days: 7,
        description: 'F2: FIX landing si clics OK mais peu de leads',
        isActive: true,
      },

      // 🟢 SCALE — Amplifier ce qui fonctionne
      {
        userId: user.id,
        ruleType: 'scale_good_performance',
        threshold: 1.0, // CPL < médiane (1.0 = 100% de la médiane)
        days: 7,
        description: 'S1: SCALE +20% si CPL < médiane et ≥5 conversions',
        isActive: true,
      },

      // 🔵 TEST — Nourrir le système
      {
        userId: user.id,
        ruleType: 'test_no_winner',
        threshold: 15, // % du budget pour tests
        days: 7,
        description: 'T1: TEST nouvelle variable (10-20% budget) si pas de gagnant',
        isActive: true,
      },
    ]

    await prisma.userRule.createMany({
      data: defaultRules,
    })

    console.log(`✅ Created ${defaultRules.length} default rules for user ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Default rules created',
      rulesCount: defaultRules.length,
    })
  } catch (error) {
    console.error('Error creating default rules:', error)
    return NextResponse.json(
      {
        error: 'Failed to create default rules',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const { rules } = await req.json()

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Invalid rules data' },
        { status: 400 }
      )
    }

    // Supprimer les anciennes règles (si onboarding re-fait)
    await prisma.userRule.deleteMany({
      where: { userId: user.id },
    })

    // Créer les nouvelles règles
    const rulesToCreate = rules.map((rule: any) => ({
      userId: user.id,
      ruleType: rule.type,
      threshold: rule.threshold,
      days: rule.days,
      isActive: true,
      description: rule.description,
    }))

    await prisma.userRule.createMany({
      data: rulesToCreate,
    })

    return NextResponse.json({ success: true, count: rulesToCreate.length })
  } catch (error) {
    console.error('Save rules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyDigest } from '@/app/actions/digest'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // IMPORTANT: Only work in development!
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    // Get first user (for testing)
    const user = await prisma.user.findFirst({
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    console.log(`Triggering digest for user: ${user.email}`)

    // Generate digest
    await generateWeeklyDigest(user.id)

    return NextResponse.json({
      success: true,
      message: `Digest sent to ${user.email}`,
      userId: user.id,
    })
  } catch (error) {
    console.error('Trigger error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
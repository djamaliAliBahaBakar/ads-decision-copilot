import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWeeklyDigest } from '@/app/actions/digest'

export async function GET(req: NextRequest) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true },
    })

    let sent = 0
    const errors = []

    for (const user of users) {
      try {
        // Check if digest already sent this week
        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())

        const existingDigest = await prisma.emailDigest.findFirst({
          where: {
            userId: user.id,
            weekStartDate: { gte: weekStart },
            sentAt: { not: null },
          },
        })

        if (!existingDigest) {
          await generateWeeklyDigest(user.id)
          sent++
        }
      } catch (error) {
        errors.push({
          userId: user.id,
          error: (error as Error).message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      errors,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Digest cron error:', error)
    return NextResponse.json(
      { error: 'Cron failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/** 
 * **Configure dans Vercel :**
1. Va sur dashboard.vercel.com → ton projet
2. Settings → Cron Jobs
3. Add Cron Job :
```
Path: /api/cron/send-digests
Schedule: 0 9 * * 1 (Monday 9 AM UTC)
Secret: your_cron_secret
 * 
 * 
 * 
*/

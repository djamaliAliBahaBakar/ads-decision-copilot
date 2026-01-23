import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncMetaAdsForUser } from '@/app/actions/meta'

export async function POST(req: NextRequest) {
  // Verify cron secret or manual trigger
  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active Meta accounts
    const metaAccounts = await prisma.metaAccount.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, email: true } } },
    })

    console.log(`[Meta Sync API] Found ${metaAccounts.length} active Meta accounts to sync`)

    const results = []
    let successCount = 0
    let errorCount = 0

    // Sync each account
    for (const account of metaAccounts) {
      try {
        console.log(`[Meta Sync API] Syncing account ${account.accountName} for user ${account.user.email}`)
        const result = await syncMetaAdsForUser(account.userId)
        successCount++
        results.push({
          userId: account.userId,
          email: account.user.email,
          accountName: account.accountName,
          status: 'success',
          adsCount: result.adsCount,
        })
      } catch (error) {
        errorCount++
        console.error(`[Meta Sync API] Failed to sync for user ${account.user.email}:`, error)
        results.push({
          userId: account.userId,
          email: account.user.email,
          accountName: account.accountName,
          status: 'error',
          error: (error as Error).message,
        })
      }
    }

    console.log(`[Meta Sync API] Sync completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      totalAccounts: metaAccounts.length,
      successCount,
      errorCount,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Meta Sync API] Global error:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET(req: NextRequest) {
  return POST(req)
}

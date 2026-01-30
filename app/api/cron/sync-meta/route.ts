import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncMetaAdsForUser } from '@/app/actions/meta'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // --- Auth: header OU query param (vercel.json ne permet pas les headers) ---
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Missing CRON_SECRET' }, { status: 500 })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${cronSecret}`

  const isAuthorized = authHeader === expectedAuth || token === cronSecret

  if (!isAuthorized) {
    console.error('[Cron Meta Sync] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron Meta Sync] Starting daily Meta sync...')

    // Get all active Meta accounts directly (no HTTP call)
    const metaAccounts = await prisma.metaAccount.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, email: true } } },
    })

    console.log(`[Cron Meta Sync] Found ${metaAccounts.length} active Meta accounts`)

    let successCount = 0
    let errorCount = 0
    const results = []

    // Sync each account
    for (const account of metaAccounts) {
      try {
        console.log(`[Cron Meta Sync] Syncing account ${account.accountName} for user ${account.user.email}`)
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
        console.error(`[Cron Meta Sync] Failed to sync for user ${account.user.email}:`, error)
        results.push({
          userId: account.userId,
          email: account.user.email,
          accountName: account.accountName,
          status: 'error',
          error: (error as Error).message,
        })
      }
    }

    console.log(`[Cron Meta Sync] Completed: ${successCount}/${metaAccounts.length} accounts synced`)

    return NextResponse.json({
      success: true,
      message: 'Daily Meta sync completed',
      totalAccounts: metaAccounts.length,
      successCount,
      errorCount,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Meta Sync] Error:', error)
    return NextResponse.json(
      {
        error: 'Meta sync cron failed',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

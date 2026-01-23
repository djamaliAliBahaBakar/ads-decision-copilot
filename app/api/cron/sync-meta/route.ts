import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron job for automatic Meta Ads sync
 * Runs daily to sync all active Meta accounts
 *
 * Configure in Vercel:
 * - Path: /api/cron/sync-meta
 * - Schedule: 0 6 * * * (6 AM UTC daily)
 * - Authorization: Bearer CRON_SECRET
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    console.error('[Cron Meta Sync] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron Meta Sync] Starting daily Meta sync...')

    // Call the Meta sync API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/meta/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Meta sync API returned ${response.status}`)
    }

    const result = await response.json()

    console.log(
      `[Cron Meta Sync] Completed: ${result.successCount}/${result.totalAccounts} accounts synced successfully`
    )

    return NextResponse.json({
      success: true,
      message: 'Daily Meta sync completed',
      ...result,
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

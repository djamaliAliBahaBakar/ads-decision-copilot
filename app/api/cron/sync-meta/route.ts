import { NextRequest, NextResponse } from 'next/server'

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

    // Base URL server-side
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL || // fallback si tu n'as pas encore APP_URL
      'http://localhost:3000'

    // Build URL with bypass secret for Vercel Deployment Protection
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    const syncUrl = bypassSecret
      ? `${baseUrl}/api/meta/sync?x-vercel-protection-bypass=${bypassSecret}`
      : `${baseUrl}/api/meta/sync`

    // Call the Meta sync API
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        Authorization: expectedAuth,
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

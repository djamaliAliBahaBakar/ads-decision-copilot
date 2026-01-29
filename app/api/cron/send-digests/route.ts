import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // --- Auth cron (header OU query param) ---
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
    console.error('[Cron Send Digests] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron Send Digests] Starting weekly digest sending...')

    // ⚠️ ici tu mets TA logique existante :
    // - fetch users
    // - build digest
    // - send email via Resend
    // - update DB (sentAt, status, etc.)

    // Exemple placeholder
    const sentCount = 0

    console.log(`[Cron Send Digests] Completed: ${sentCount} digests sent`)

    return NextResponse.json({
      success: true,
      message: 'Weekly digests sent',
      sentCount,
    })
  } catch (error) {
    console.error('[Cron Send Digests] Error:', error)
    return NextResponse.json(
      {
        error: 'Send digests cron failed',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

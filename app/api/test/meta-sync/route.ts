import { NextRequest, NextResponse } from 'next/server'

/**
 * Test route for Meta Sync
 * ONLY available in development mode
 *
 * Test the sync endpoint:
 * http://localhost:3000/api/test/meta-sync
 */
export async function GET(req: NextRequest) {
  // IMPORTANT: Only work in development!
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    console.log('[Test Meta Sync] Testing Meta sync API...')

    // Call the Meta sync API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/meta/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        status: response.status,
        error: errorData,
      })
    }

    const result = await response.json()

    console.log('[Test Meta Sync] Success:', result)

    return NextResponse.json({
      success: true,
      message: 'Meta sync test completed',
      ...result,
    })
  } catch (error) {
    console.error('[Test Meta Sync] Error:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

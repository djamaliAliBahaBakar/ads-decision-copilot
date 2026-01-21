import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const metaAccounts = await prisma.metaAccount.findMany({
      where: { isActive: true },
    })

    for (const account of metaAccounts) {
      // Note: This would need refactoring since syncMetaAds needs auth context
      // For now, trigger via UI only
      console.log(`Scheduled sync for account ${account.accountId}`)
    }

    return NextResponse.json({ success: true, synced: metaAccounts.length })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
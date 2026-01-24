import { NextResponse } from 'next/server'
import { getAccess } from '@/lib/access'

export async function GET() {
  try {
    const access = await getAccess()

    if (!access) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Return client-safe access info (no sensitive subscription details)
    return NextResponse.json({
      level: access.level,
      isPaid: access.isPaid,
      isSuperuser: access.isSuperuser,
      canCreateDecision: access.canCreateDecision,
      canViewDecisionDetails: access.canViewDecisionDetails,
      canExportData: access.canExportData,
      canCreateCustomRules: access.canCreateCustomRules,
      canAccessFullJournal: access.canAccessFullJournal,
      isEarlyAdopter: access.subscription?.isEarlyAdopter ?? false,
    })
  } catch (error) {
    console.error('Error fetching access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

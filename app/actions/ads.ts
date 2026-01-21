'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csv-parser'

export async function uploadAds(csvText: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  // Get user from DB
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Parse CSV
  const rows = await parseCSV(csvText)

  if (rows.length === 0) {
    throw new Error('No valid rows in CSV')
  }

  // Insert all ads
  const ads = await Promise.all(
    rows.map(row =>
      prisma.ad.create({
        data: {
          userId: user.id,
          adName: row.ad_name,
          campaignName: row.campaign_name || 'Unknown',
          angle: row.angle || 'Unknown',
          cpl: row.cpl,
          spend: row.spend,
          leads: row.leads,
          ctr: row.ctr || null,
          roas: row.roas || null,
          date: new Date(row.date),
        },
      })
    )
  )

  return {
    success: true,
    count: ads.length,
  }
}

export async function getWeekData() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const ads = await prisma.ad.findMany({
    where: {
      userId: user.id,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'desc' },
  })

  // Calculs
  const totalSpend = ads.reduce((sum, ad) => sum + ad.spend, 0)
  const totalLeads = ads.reduce((sum, ad) => sum + ad.leads, 0)
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const avgRoas = ads.length > 0 
    ? ads.reduce((sum, ad) => sum + (ad.roas || 0), 0) / ads.length 
    : 0

  // CPL trend (vs 14 days before)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const sevenDaysBeforeAgo = new Date()
  sevenDaysBeforeAgo.setDate(sevenDaysBeforeAgo.getDate() - 7)

  const adsPrevWeek = await prisma.ad.findMany({
    where: {
      userId: user.id,
      date: { 
        gte: fourteenDaysAgo,
        lt: sevenDaysBeforeAgo,
      },
    },
  })

  const prevWeekCpl = adsPrevWeek.length > 0
    ? adsPrevWeek.reduce((sum, ad) => sum + ad.spend, 0) / 
      adsPrevWeek.reduce((sum, ad) => sum + ad.leads, 0)
    : avgCpl

  const cplTrend = prevWeekCpl > 0 
    ? ((avgCpl - prevWeekCpl) / prevWeekCpl) * 100 
    : 0

  // Graph data (7 jours)
  const graphData: { date: string; cpl: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayAds = ads.filter(
      ad => ad.date.toISOString().split('T')[0] === dateStr
    )

    const dayCpl = dayAds.length > 0
      ? dayAds.reduce((sum, ad) => sum + ad.spend, 0) / 
        dayAds.reduce((sum, ad) => sum + ad.leads, 0)
      : 0

    graphData.push({
      date: dateStr,
      cpl: parseFloat(dayCpl.toFixed(2)),
    })
  }

  return {
    totalSpend,
    totalLeads,
    avgCpl,
    avgRoas,
    cplTrend,
    ads: ads.map(ad => ({
      ...ad,
      date: ad.date,
    })),
    graphData,
  }
}
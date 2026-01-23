'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getOrCreateUser } from '@/lib/get-or-create-user'

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET
const META_REDIRECT_URI = process.env.META_REDIRECT_URI

interface MetaAdData {
  id: string
  name: string
  campaign: {
    id: string
    name: string
  }
  insights: {
    spend: number
    impressions: number
    clicks: number
    conversions: number
    cpc?: number
    ctr?: number
    date_start: string
  }[]
}

// Step 1: Generate Meta OAuth URL
export async function getMetaAuthUrl() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const scope = [
    'ads_management',
    'ads_read',
    'business_management',
  ].join(',')

  const url = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  url.searchParams.append('client_id', META_APP_ID!)
  url.searchParams.append('redirect_uri', META_REDIRECT_URI!)
  url.searchParams.append('scope', scope)
  url.searchParams.append('state', userId)

  return url.toString()
}

// Step 2: Exchange code for token
export async function handleMetaCallback(code: string, state: string) {
  const user = await getOrCreateUser()
  if (!user) throw new Error('User not found')

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.instagram.com/v18.0/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: META_APP_ID!,
        client_secret: META_APP_SECRET!,
        redirect_uri: META_REDIRECT_URI!,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('No access token returned')
    }

    // Get user's ad accounts
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}`
    )
    const adAccountsData = await adAccountsResponse.json()

    if (!adAccountsData.data || adAccountsData.data.length === 0) {
      throw new Error('No ad accounts found')
    }

    const firstAccount = adAccountsData.data[0]

    // Save Meta account
    await prisma.metaAccount.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        accountId: firstAccount.account_id,
        accountName: firstAccount.name,
        isActive: true,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        accountId: firstAccount.account_id,
        accountName: firstAccount.name,
        isActive: true,
      },
    })

    // Trigger initial sync
    await syncMetaAds()

    revalidatePath('/dashboard/settings')
    return { success: true, accountName: firstAccount.name }
  } catch (error) {
    console.error('Meta callback error:', error)
    throw error
  }
}

// Step 3: Sync ads from Meta
export async function syncMetaAds() {
  const user = await getOrCreateUser()
  if (!user) throw new Error('User not found')

  const metaAccount = await prisma.metaAccount.findUnique({
    where: { userId: user.id },
  })
  if (!metaAccount || !metaAccount.isActive) {
    throw new Error('Meta account not connected')
  }

  try {
    // Update sync status
    await prisma.metaAccount.update({
      where: { id: metaAccount.id },
      data: { syncStatus: 'syncing' },
    })

    // Fetch campaigns
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${metaAccount.accountId}/campaigns?access_token=${metaAccount.accessToken}&fields=id,name,status`
    )
    const campaignsData = await campaignsResponse.json()

    if (!campaignsData.data) {
      throw new Error('Failed to fetch campaigns')
    }

    // Fetch ads with insights
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    for (const campaign of campaignsData.data) {
      const adsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${campaign.id}/ads?access_token=${metaAccount.accessToken}&fields=id,name,adset,campaign`
      )
      const adsData = await adsResponse.json()

      for (const ad of adsData.data) {
        // Fetch insights for this ad
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${ad.id}/insights?access_token=${metaAccount.accessToken}&fields=spend,impressions,clicks,actions,action_values&date_preset=last_7d`
        )
        const insightsData = await insightsResponse.json()

        if (insightsData.data && insightsData.data.length > 0) {
          const insight = insightsData.data[0]

          // Calculate metrics
          const spend = parseFloat(insight.spend || '0')
          const clicks = parseInt(insight.clicks || '0')
          const impressions = parseInt(insight.impressions || '0')
          const conversions = insight.actions
            ? insight.actions.reduce(
                (sum: number, a: any) => sum + (a.action_type === 'lead' ? a.value : 0),
                0
              )
            : 0

          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
          const cpl = conversions > 0 ? spend / conversions : 0

          // Store in DB
          await prisma.ad.upsert({
            where: {
              userId_metaAdId: {
                userId: user.id,
                metaAdId: ad.id,
              },
            },
            create: {
              userId: user.id,
              adName: ad.name,
              campaignName: campaign.name,
              metaAdId: ad.id,
              metaCampaignId: campaign.id,
              angle: 'Meta Sync',
              spend,
              leads: conversions,
              impressions,
              clicks,
              ctr: ctr / 100,
              cpl,
              roas: 0, // Can't get from Meta easily
              date: today,
            },
            update: {
              spend,
              leads: conversions,
              impressions,
              clicks,
              ctr: ctr / 100,
              cpl,
              date: today,
            },
          })
        }
      }
    }

    // Update sync status
    await prisma.metaAccount.update({
      where: { id: metaAccount.id },
      data: {
        syncStatus: 'idle',
        lastSyncAt: new Date(),
        syncError: null,
      },
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Sync error:', error)
    await prisma.metaAccount.update({
      where: { id: metaAccount.id },
      data: {
        syncStatus: 'error',
        syncError: (error as Error).message,
      },
    })
    throw error
  }
}

// Get Meta account status
export async function getMetaAccountStatus() {
  const user = await getOrCreateUser()
  if (!user) throw new Error('User not found')

  return await prisma.metaAccount.findUnique({
    where: { userId: user.id },
  })
}

// Disconnect Meta account
export async function disconnectMetaAccount() {
  const user = await getOrCreateUser()
  if (!user) throw new Error('User not found')

  await prisma.metaAccount.delete({
    where: { userId: user.id },
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}
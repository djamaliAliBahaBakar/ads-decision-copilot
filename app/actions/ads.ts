'use server'

import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csv-parser'
import { getOrCreateUser } from '@/lib/get-or-create-user'

export async function uploadAds(csvText: string) {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error('User not found')
  }

  // Parse CSV avec support Meta automatique
  const result = await parseCSV(csvText)

  if (result.data.length === 0) {
    const errorMsg = result.errors.length > 0
      ? result.errors.map(e => e.message).join(', ')
      : 'No valid rows in CSV'
    throw new Error(errorMsg)
  }

  // Récupérer les données existantes pour détecter les doublons
  const existingAds = await prisma.ad.findMany({
    where: { userId: user.id },
    select: { adName: true, adSetName: true, metaAdId: true, date: true },
  })

  // Créer des Sets pour la détection des doublons
  // 1. Par metaAdId (prioritaire si disponible)
  const existingMetaAdIds = new Set(
    existingAds.filter(ad => ad.metaAdId).map(ad => ad.metaAdId)
  )
  // 2. Par clé composite (fallback)
  const existingKeys = new Set(
    existingAds.map(ad => `${ad.adName}|${ad.adSetName || ''}|${ad.date.toISOString().split('T')[0]}`)
  )

  // Filtrer les doublons
  const newRows = result.data.filter(row => {
    // Si l'import a un metaAdId, l'utiliser comme clé primaire
    if (row.meta_ad_id) {
      return !existingMetaAdIds.has(row.meta_ad_id)
    }
    // Sinon, utiliser la clé composite (adName + adSetName + date)
    const key = `${row.ad_name}|${row.ad_set_name || ''}|${row.date}`
    return !existingKeys.has(key)
  })

  const duplicatesCount = result.data.length - newRows.length

  // Compter les pubs uniques (dans les nouvelles données)
  const uniqueAdNames = new Set(newRows.map(row => row.ad_name))
  const uniqueAdsCount = uniqueAdNames.size

  // Insert seulement les nouvelles ads
  let createdCount = 0
  if (newRows.length > 0) {
    await prisma.ad.createMany({
      data: newRows.map(row => ({
        userId: user.id,
        adName: row.ad_name,
        campaignName: row.campaign_name || 'Unknown',
        adSetName: row.ad_set_name || null,
        metaAdId: row.meta_ad_id || null,
        angle: row.angle || 'Unknown',
        cpl: row.cpl,
        spend: row.spend,
        leads: row.leads,
        ctr: row.ctr || null,
        roas: row.roas || null,
        date: new Date(row.date),
      })),
    })
    createdCount = newRows.length
  }

  // Warnings (inclure les warnings du parser)
  const warnings: string[] = result.warnings ? [...result.warnings] : []

  if (duplicatesCount > 0) {
    warnings.push(
      `ℹ️ ${duplicatesCount} ligne(s) ignorée(s) (déjà importées).`
    )
  }

  if (duplicatesCount === result.data.length) {
    warnings.push(
      '⚠️ Toutes les données étaient déjà présentes. Rien de nouveau importé.'
    )
  }

  if (uniqueAdsCount === 1 && createdCount > 0) {
    warnings.push(
      '⚠️ Une seule pub détectée. AdsDecision est plus utile avec plusieurs pubs à comparer.'
    )
  }

  return {
    success: true,
    count: createdCount,
    duplicatesIgnored: duplicatesCount,
    uniqueAdsCount,
    warnings,
  }
}

export async function getWeekData() {
  const user = await getOrCreateUser()
  if (!user) {
    throw new Error('User not found')
  }

  // Récupérer TOUTES les données (supporte les imports agrégés)
  const ads = await prisma.ad.findMany({
    where: {
      userId: user.id,
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

// Nouvelle fonction pour le Dashboard centré sur les angles
export async function getAnglesPerformance() {
  const user = await getOrCreateUser()
  if (!user) {
    throw new Error('User not found')
  }

  // Récupérer TOUTES les données de l'utilisateur (supporte les imports agrégés)
  const ads = await prisma.ad.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { date: 'desc' },
  })

  if (ads.length === 0) {
    return null
  }

  // Grouper par angle
  const angleGroups: Record<string, {
    totalSpend: number
    totalLeads: number
    adCount: number
    ads: string[]
  }> = {}

  ads.forEach(ad => {
    const angle = ad.angle || 'AUTRE'
    if (!angleGroups[angle]) {
      angleGroups[angle] = { totalSpend: 0, totalLeads: 0, adCount: 0, ads: [] }
    }
    angleGroups[angle].totalSpend += ad.spend
    angleGroups[angle].totalLeads += ad.leads
    angleGroups[angle].adCount++
    if (!angleGroups[angle].ads.includes(ad.adName)) {
      angleGroups[angle].ads.push(ad.adName)
    }
  })

  // Calculer CPL par angle et trier
  const angles = Object.entries(angleGroups)
    .map(([name, data]) => ({
      name: name.toUpperCase(),
      cpl: data.totalLeads > 0 ? data.totalSpend / data.totalLeads : 999,
      spend: data.totalSpend,
      leads: data.totalLeads,
      adCount: data.ads.length,
    }))
    .filter(a => a.leads > 0)
    .sort((a, b) => a.cpl - b.cpl)

  if (angles.length === 0) {
    return null
  }

  // Assigner statut basé sur le ranking CPL
  const bestCpl = angles[0].cpl
  const anglesWithStatus = angles.map((angle) => {
    const ratio = angle.cpl / bestCpl
    let status: 'winner' | 'strong' | 'ok' | 'danger'
    let stars: number

    if (ratio <= 1.1) {
      status = 'winner'
      stars = 5
    } else if (ratio <= 1.5) {
      status = 'strong'
      stars = 4
    } else if (ratio <= 2.0) {
      status = 'ok'
      stars = 3
    } else {
      status = 'danger'
      stars = Math.max(1, 3 - Math.floor(ratio / 2))
    }

    return { ...angle, status, stars }
  })

  // Calculer l'opportunité (économies potentielles)
  const totalSpend = angles.reduce((sum, a) => sum + a.spend, 0)
  const dangerAngles = anglesWithStatus.filter(a => a.status === 'danger')
  const potentialSavings = dangerAngles.reduce((sum, a) => sum + a.spend * 0.6, 0)

  // Compter les ads à décider (celles des angles "danger")
  const adsToDecide = dangerAngles.reduce((sum, a) => sum + a.adCount, 0)

  return {
    angles: anglesWithStatus,
    totalSpend,
    potentialSavings: Math.round(potentialSavings),
    adsToDecide,
    worstAngle: dangerAngles.length > 0 ? dangerAngles[dangerAngles.length - 1] : null,
  }
}

// Nouvelle fonction pour le Dashboard - groupé par nom de pub
export async function getAdsPerformanceSummary() {
  const user = await getOrCreateUser()
  if (!user) {
    throw new Error('User not found')
  }

  const ads = await prisma.ad.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  })

  if (ads.length === 0) {
    return null
  }

  // Grouper par nom de pub
  const adGroups: Record<string, {
    totalSpend: number
    totalLeads: number
    entries: number
  }> = {}

  ads.forEach(ad => {
    const key = ad.adName
    if (!adGroups[key]) {
      adGroups[key] = { totalSpend: 0, totalLeads: 0, entries: 0 }
    }
    adGroups[key].totalSpend += ad.spend
    adGroups[key].totalLeads += ad.leads
    adGroups[key].entries++
  })

  // Convertir en tableau avec CPL calculé
  const adsWithCpl = Object.entries(adGroups).map(([name, data]) => ({
    name,
    spend: data.totalSpend,
    leads: data.totalLeads,
    cpl: data.totalLeads > 0 ? data.totalSpend / data.totalLeads : 0,
  }))

  // KPIs globaux
  const totalSpend = adsWithCpl.reduce((sum, a) => sum + a.spend, 0)
  const totalLeads = adsWithCpl.reduce((sum, a) => sum + a.leads, 0)
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0

  // Séparer les pubs avec leads et sans leads
  const adsWithLeads = adsWithCpl.filter(a => a.leads > 0).sort((a, b) => a.cpl - b.cpl)
  const adsWithoutLeads = adsWithCpl.filter(a => a.leads === 0 && a.spend > 0)

  // Top 3 meilleures (CPL le plus bas)
  const topPerformers = adsWithLeads.slice(0, 3)

  // Top 3 pires: d'abord les pubs sans leads (gaspillage), puis CPL le plus haut
  const worstPerformers = [
    ...adsWithoutLeads.sort((a, b) => b.spend - a.spend).slice(0, 3),
    ...adsWithLeads.slice(-3).reverse(),
  ].slice(0, 3)

  // Calculer les économies potentielles (pubs sans leads + pubs avec CPL > 2x moyenne)
  const wastefulAds = [
    ...adsWithoutLeads,
    ...adsWithLeads.filter(a => a.cpl > avgCpl * 2),
  ]
  const potentialSavings = wastefulAds.reduce((sum, a) => sum + a.spend * 0.6, 0)

  return {
    // KPIs globaux
    totalSpend,
    totalLeads,
    avgCpl,
    adsCount: adsWithCpl.length,

    // Top performers
    topPerformers,
    worstPerformers,

    // Opportunité
    potentialSavings: Math.round(potentialSavings),
    adsToDecide: worstPerformers.length,
  }
}
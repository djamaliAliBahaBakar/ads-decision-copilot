'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getOrCreateUser } from '@/lib/get-or-create-user'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function generateWeeklyDigest(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { emailDigests: { where: { sentAt: null } } },
    })

    if (!user || !user.email) {
      throw new Error('User or email not found')
    }

    // Calculate week dates
    const today = new Date()
    const weekStartDate = new Date(today)
    weekStartDate.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6) // End of week (Saturday)

    // Get decisions from this week
    const decisions = await prisma.decision.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      include: { ad: true },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate discipline score
    const rules = await prisma.userRule.findMany({
      where: { userId, isActive: true },
    })

    let followedCount = 0
    let totalApplicable = 0

    decisions.forEach(decision => {
      const applicable = rules.some(rule => {
        if (rule.ruleType === 'kill_if_cpl' && decision.cplAtDecision > rule.threshold) return true
        if (rule.ruleType === 'scale_if_roas') return true
        if (rule.ruleType === 'hold_if_learning') return true
        return false
      })

      if (applicable) {
        totalApplicable++
        if (decision.followedRule) followedCount++
      }
    })

    const disciplineScore = totalApplicable > 0 ? (followedCount / totalApplicable) * 100 : 0

    // Get best/worst decisions
    const killDecisions = decisions.filter(d => d.action === 'KILL')
    const scaleDecisions = decisions.filter(d => d.action === 'SCALE')
    const bestDecision = scaleDecisions.length > 0 ? scaleDecisions[0] : null
    const worstDecision = killDecisions.length > 0 ? killDecisions[0] : null

    // Calculate CPL trend
    const ads = await prisma.ad.findMany({
      where: {
        userId,
        date: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
    })

    const avgCpl = ads.length > 0
      ? ads.reduce((sum, ad) => sum + ad.cpl, 0) / ads.length
      : 0

    // Get previous week CPL for comparison
    const prevWeekStart = new Date(weekStartDate)
    prevWeekStart.setDate(weekStartDate.getDate() - 7)
    const prevWeekEnd = new Date(prevWeekStart)
    prevWeekEnd.setDate(prevWeekStart.getDate() + 6)

    const prevWeekAds = await prisma.ad.findMany({
      where: {
        userId,
        date: {
          gte: prevWeekStart,
          lte: prevWeekEnd,
        },
      },
    })

    const prevWeekCpl = prevWeekAds.length > 0
      ? prevWeekAds.reduce((sum, ad) => sum + ad.cpl, 0) / prevWeekAds.length
      : avgCpl

    const cplTrend = prevWeekCpl > 0 ? ((avgCpl - prevWeekCpl) / prevWeekCpl) * 100 : 0

    // Calculate total savings (from decisions)
    const economiesSaved = decisions
      .filter(d => d.actualSavings !== null)
      .reduce((sum, d) => sum + (d.actualSavings || 0), 0)

    // Generate insight
    let topInsight = ''
    if (disciplineScore >= 80) {
      topInsight = '🔥 Excellent discipline cette semaine ! Tu as suivi toutes tes règles.'
    } else if (disciplineScore >= 50) {
      topInsight = '📈 Bonne semaine ! Continue à appliquer tes règles pour maximiser le ROI.'
    } else if (scaleDecisions.length > killDecisions.length) {
      topInsight = '🚀 Aggression payante ! Plus de SCALE que de KILL cette semaine.'
    } else if (economiesSaved > 100) {
      topInsight = `💰 Excellent ! Tu as économisé €${economiesSaved.toFixed(0)} en killant les mauvais ads.`
    } else {
      topInsight = '💡 Petite semaine. Reste attentif à tes règles pour les prochains jours.'
    }

    // Create digest record
    const digest = await prisma.emailDigest.create({
      data: {
        userId,
        weekStartDate,
        weekEndDate,
        disciplineScore,
        economiesSaved,
        bestDecision: bestDecision?.ad.adName || null,
        worstDecision: worstDecision?.ad.adName || null,
        cplTrend,
        topInsight,
      },
    })

    // Send email
    await sendDigestEmail(user, digest, decisions)

    // Update sentAt
    await prisma.emailDigest.update({
      where: { id: digest.id },
      data: { sentAt: new Date() },
    })

    return { success: true, digestId: digest.id }
  } catch (error) {
    console.error('Digest generation error:', error)
    throw error
  }
}

async function sendDigestEmail(user: any, digest: any, decisions: any[]) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .card h3 { margin-top: 0; color: #667eea; }
          .metric { display: inline-block; width: 48%; margin: 5px 1%; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .decision { background: white; border-left: 4px solid #667eea; padding: 12px; margin: 10px 0; }
          .decision.bad { border-left-color: #dc3545; }
          .decision.good { border-left-color: #28a745; }
          .insight { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .cta { text-align: center; margin: 30px 0; }
          .cta a { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; }
          .cta a:hover { background: #5568d3; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Ta Semaine Tiltmeter</h1>
            <p>${new Date(digest.weekStartDate).toLocaleDateString('fr-FR')} - ${new Date(digest.weekEndDate).toLocaleDateString('fr-FR')}</p>
          </div>

          <div class="card">
            <h3>📈 Résumé Semaine</h3>
            <div>
              <div class="metric">
                <div class="metric-value">${digest.disciplineScore.toFixed(0)}%</div>
                <div class="metric-label">Discipline</div>
              </div>
              <div class="metric">
                <div class="metric-value">€${digest.economiesSaved.toFixed(0)}</div>
                <div class="metric-label">Économies</div>
              </div>
            </div>
          </div>

          ${digest.bestDecision ? `
          <div class="card">
            <h3>✅ Meilleure Décision</h3>
            <div class="decision good">
              <strong>${digest.bestDecision}</strong><br>
              SCALE → Bonne appel !
            </div>
          </div>
          ` : ''}

          ${digest.worstDecision ? `
          <div class="card">
            <h3>❌ À Améliorer</h3>
            <div class="decision bad">
              <strong>${digest.worstDecision}</strong><br>
              KILL → Avais raison de la tuer.
            </div>
          </div>
          ` : ''}

          ${digest.cplTrend !== 0 ? `
          <div class="card">
            <h3>📊 Tendance CPL</h3>
            <p>${digest.cplTrend > 0 ? '📈' : '📉'} ${Math.abs(digest.cplTrend).toFixed(1)}% vs semaine précédente</p>
          </div>
          ` : ''}

          <div class="insight">
            <strong>💡 Insight de la semaine</strong><br>
            ${digest.topInsight}
          </div>

          <div class="cta">
            <a href="${appUrl}/dashboard/journal">👉 Voir tes décisions en détail</a>
          </div>

          <div class="footer">
            <p>© Tiltmeter - Les emails digests arrivent chaque lundi matin</p>
            <p><a href="${appUrl}/dashboard/settings">Gérer les préférences email</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  await resend.emails.send({
    from: 'Tiltmeter <digest@tiltmeter.app>',
    to: user.email,
    subject: `📊 Ta Semaine Tiltmeter - ${digest.disciplineScore.toFixed(0)}% Discipline`,
    html,
  })
}

// Get user's digest settings
export async function getDigestSettings() {
  const user = await getOrCreateUser()
  if (!user) throw new Error('User not found')

  const digest = await prisma.emailDigest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return {
    isEnabled: digest?.isEnabled ?? true,
    lastDigest: digest?.sentAt,
  }
}

// Toggle digest
export async function toggleDigest(enabled: boolean) {
  const user = await getOrCreateUser()
  if (!user) throw new Error('User not found')

  const digest = await prisma.emailDigest.findFirst({
    where: { userId: user.id },
  })

  if (digest) {
    await prisma.emailDigest.update({
      where: { id: digest.id },
      data: { isEnabled: enabled },
    })
  }
}
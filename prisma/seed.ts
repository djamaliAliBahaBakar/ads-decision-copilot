import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Trouve le user créé (prends le premier ou crée un test user)
  let user = await prisma.user.findFirst()

  if (!user) {
    console.log('No user found. Create one via Clerk first.')
    return
  }

  console.log(`Seeding data for user: ${user.email}`)

  // Delete existing ads for this user
  await prisma.ad.deleteMany({
    where: { userId: user.id },
  })

  const existingRules = await prisma.userRule.findMany({
    where: { userId: user.id },
  })

  if (existingRules.length === 0) {
    await prisma.userRule.createMany({
      data: [
        {
          userId: user.id,
          ruleType: 'kill_if_cpl',
          threshold: 12,
          days: 3,
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'scale_if_roas',
          threshold: 3,
          days: 2,
          isActive: true,
        },
        {
          userId: user.id,
          ruleType: 'kill_if_ctr_down',
          threshold: 0.8,
          days: 3,
          isActive: true,
        },
      ],
    })
    console.log(`✅ Created 3 default rules`)
  }

  const angles = ['PROBLEME', 'MECANISME', 'PREUVE', 'TRANSFORMATION', 'OBJECTION']
  const campaigns = ['Atelier Emotional Eating', 'Webinar Launch']

  // Créer 30 jours de data
  const ads = []
  const today = new Date()

  for (let dayOffset = 30; dayOffset > 0; dayOffset--) {
    const date = new Date()
    date.setDate(date.getDate() - dayOffset)

    // 3-5 ads par jour
    const adsPerDay = Math.floor(Math.random() * 3) + 3

    for (let i = 0; i < adsPerDay; i++) {
      const angle = angles[Math.floor(Math.random() * angles.length)]
      const campaign = campaigns[Math.floor(Math.random() * campaigns.length)]

      // Simulator: certains angles performent mieux
      let baseCpl = 8
      if (angle === 'MECANISME') baseCpl = 12
      if (angle === 'PREUVE') baseCpl = 6
      if (angle === 'PROBLEME') baseCpl = 7
      if (angle === 'TRANSFORMATION') baseCpl = 9
      if (angle === 'OBJECTION') baseCpl = 11

      // Variance
      const cpl = baseCpl + (Math.random() - 0.5) * 4
      const spend = 100 + Math.random() * 400
      const leads = Math.floor(spend / cpl)
      const ctr = 0.015 + Math.random() * 0.025
      const roas = 1.5 + Math.random() * 3

      ads.push({
        userId: user.id,
        adName: `${angle}_Day${dayOffset}_#${i}`,
        campaignName: campaign,
        angle,
        cpl: parseFloat(cpl.toFixed(2)),
        spend: parseFloat(spend.toFixed(2)),
        leads,
        ctr: parseFloat(ctr.toFixed(4)),
        roas: parseFloat(roas.toFixed(2)),
        date,
      })
    }
  }

  // Insert
  await prisma.ad.createMany({ data: ads })
  console.log(`✅ Created ${ads.length} ads`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
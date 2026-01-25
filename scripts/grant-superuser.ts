/**
 * Script pour accorder le statut SUPERUSER à un utilisateur
 *
 * Usage:
 *   npx ts-node scripts/grant-superuser.ts <email>
 *
 * Exemple:
 *   npx ts-node scripts/grant-superuser.ts mon@email.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function grantSuperuser(email: string) {
  console.log(`\n🔐 Recherche de l'utilisateur: ${email}\n`)

  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  })

  if (!user) {
    console.error(`❌ Utilisateur non trouvé: ${email}`)
    console.log('\nUtilisateurs disponibles:')
    const users = await prisma.user.findMany({ select: { email: true } })
    users.forEach(u => console.log(`  - ${u.email}`))
    process.exit(1)
  }

  console.log(`✅ Utilisateur trouvé: ${user.email} (${user.id})`)

  // Créer ou mettre à jour la subscription
  const subscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      accessLevel: 'SUPERUSER',
      status: 'ACTIVE',
    },
    update: {
      accessLevel: 'SUPERUSER',
      status: 'ACTIVE',
    },
  })

  console.log(`\n🎉 SUPERUSER accordé!`)
  console.log(`   Level: ${subscription.accessLevel}`)
  console.log(`   Status: ${subscription.status}`)
  console.log(`\n✨ Rafraîchis l'app pour voir les changements.\n`)
}

// Récupérer l'email depuis les arguments
const email = process.argv[2]

if (!email) {
  console.log(`
Usage: npx ts-node scripts/grant-superuser.ts <email>

Exemple:
  npx ts-node scripts/grant-superuser.ts mon@email.com
`)
  process.exit(1)
}

grantSuperuser(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect())

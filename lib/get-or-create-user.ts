import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Helper pour attendre un délai
 */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Récupère l'email depuis Clerk avec retry pour les nouveaux utilisateurs OAuth
 */
async function getClerkUserEmail(maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses[0]?.emailAddress
      if (email) return email

      // Si pas d'email mais pas d'erreur, attendre et réessayer
      if (attempt < maxRetries) {
        await delay(500 * attempt) // 500ms, 1s, 1.5s
      }
    } catch (error) {
      console.warn(`Clerk currentUser() attempt ${attempt}/${maxRetries} failed:`, error)
      if (attempt < maxRetries) {
        await delay(500 * attempt)
      }
    }
  }
  return null
}

/**
 * Récupère ou crée l'utilisateur dans Prisma depuis Clerk
 * Utiliser cette fonction au lieu de faire findUnique directement
 */
export async function getOrCreateUser() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Essayer de récupérer l'utilisateur
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // Si n'existe pas → créer
  if (!user) {
    // Récupérer l'email depuis Clerk avec retry
    const email = await getClerkUserEmail()

    if (!email) {
      // Fallback: créer avec email temporaire basé sur clerkId
      // L'email sera mis à jour lors de la prochaine connexion réussie
      console.warn(`Could not get email from Clerk for user ${userId}, using temporary email`)

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: `pending-${userId}@temp.local`,
          onboardingCompleted: false,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          onboardingCompleted: false,
        },
      })
    }
  } else if (user.email.startsWith('pending-') && user.email.endsWith('@temp.local')) {
    // Mettre à jour l'email temporaire si on peut maintenant le récupérer
    const email = await getClerkUserEmail(1) // Un seul essai
    if (email) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email },
      })
    }
  }

  return user
}

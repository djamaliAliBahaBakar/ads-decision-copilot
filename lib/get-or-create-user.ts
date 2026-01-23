import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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
    // Récupérer l'email depuis Clerk
    const clerkUser = await (await import('@clerk/nextjs/server')).currentUser()
    
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    
    if (!email) {
      throw new Error('Email not found in Clerk user')
    }

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        onboardingCompleted: false,
      },
    })
  }

  return user
}

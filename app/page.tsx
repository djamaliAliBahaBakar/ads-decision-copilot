import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/get-or-create-user'

export default async function HomePage() {
  const { userId } = await auth()

  // Si user connecté → vérifier onboarding
  if (userId) {
    const user = await getOrCreateUser()

    // Si onboarding pas complété → onboarding
    if (!user.onboardingCompleted) {
      redirect('/onboarding')
    }

    // Sinon → dashboard
    redirect('/dashboard')
  }

  // Si pas connecté → sign-in
  redirect('/sign-in')
}
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()

  // Si user connecté → dashboard
  if (userId) {
    redirect('/dashboard')
  }

  // Si pas connecté → sign-in
  redirect('/sign-in')
}
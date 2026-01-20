import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { clerkClient } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Chercher user dans DB
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // Si user n'existe pas, le créer automatiquement
  if (!user) {
    try {
      // Récupérer info user depuis Clerk
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      // Créer user dans DB
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
        },
      })

      console.log(`✅ User created in DB: ${user.email}`)
    } catch (error) {
      console.error('Error creating user:', error)
      return (
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Erreur lors de la création du profil. Veuillez réessayer.
              </p>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bienvenue !</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Email :</span> {user.email}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">User ID :</span> {user.id}
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Clerk ID : {userId}
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✅ Auth fonctionne parfaitement !
          </p>
          <p className="text-green-700 text-sm mt-1">
            Prochaine étape : Feature Upload CSV
          </p>
        </div>

        {/* Placeholder futures features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4 opacity-50">
            <h3 className="font-semibold mb-2">📊 Dashboard</h3>
            <p className="text-sm text-gray-600">À venir : Métriques clés</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 opacity-50">
            <h3 className="font-semibold mb-2">🎯 Decision Board</h3>
            <p className="text-sm text-gray-600">À venir : Kill/Scale/Hold</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 opacity-50">
            <h3 className="font-semibold mb-2">📈 Performance</h3>
            <p className="text-sm text-gray-600">À venir : Analyse angles</p>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

export function BetaBanner({ expiresAt }: { expiresAt: Date }) {
  const expDate = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  if (daysLeft <= 0) return null

  return (
    <div className="bg-blue-600 text-white text-center text-sm py-2 px-4">
      Accès Beta gratuit — {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''} (expire le {expDate.toLocaleDateString('fr-FR')})
    </div>
  )
}

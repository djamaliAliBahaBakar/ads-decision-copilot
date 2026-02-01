'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccess } from '@/lib/use-access'
import { CreditCard, ExternalLink, Loader2, Crown } from 'lucide-react'

export function SubscriptionSettings() {
  const { access, loading: accessLoading } = useAccess()
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Portal error:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (accessLoading) {
    return (
      <Card className="p-6">
        <div className="h-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  // Only show for paid users
  if (!access?.isPaid) {
    return null
  }

  return (
    <Card className="p-6 slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Abonnement Pro</h2>
          <p className="text-sm text-gray-500">Ton abonnement est actif</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-green-800">
          <span className="font-medium">Status:</span> Actif
        </p>
        {access.level === 'SUPERUSER' && (
          <p className="text-xs text-green-600 mt-1">
            Compte Superuser - Accès illimité
          </p>
        )}
      </div>

      <Button
        onClick={handleManageSubscription}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirection...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Gérer mon abonnement
            <ExternalLink className="w-3 h-3 ml-1" />
          </span>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Modifier le moyen de paiement, changer de plan ou annuler
      </p>
    </Card>
  )
}

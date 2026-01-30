'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Zap, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAccess } from '@/lib/use-access'

interface PaymentSuccessProps {
  onContinue?: () => void
}

export function PaymentSuccess({ onContinue }: PaymentSuccessProps) {
  const { refetch } = useAccess()
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verify session and upgrade user on mount
  useEffect(() => {
    const verifySession = async () => {
      const sessionId = searchParams.get('session_id')

      if (!sessionId) {
        setError('Session ID manquant')
        setVerifying(false)
        return
      }

      try {
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (data.success) {
          setVerified(true)
          // Refetch access to update client state
          await refetch()
        } else {
          setError(data.error || 'Erreur de vérification')
        }
      } catch (err) {
        console.error('Verification error:', err)
        setError('Erreur lors de la vérification du paiement')
      } finally {
        setVerifying(false)
      }
    }

    verifySession()
  }, [searchParams, refetch])

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vérification en cours...
          </h1>
          <p className="text-gray-600">
            Nous activons ton accès Pro.
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur de vérification
          </h1>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Si ton paiement a été effectué, contacte-nous à contact@adsdecision.com
          </p>
          <Link href="/dashboard">
            <Button variant="outline">
              Retour au Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Success icon */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue dans le mode Pro !
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          Toutes les fonctionnalités sont maintenant débloquées.
          <br />
          Décisions illimitées, digest hebdo, et plus encore.
        </p>

        {/* CTA */}
        <Link href="/dashboard">
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold"
          >
            Commencer à décider
          </Button>
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useAccess } from '@/lib/use-access'

interface PaymentSuccessProps {
  onContinue?: () => void
}

export function PaymentSuccess({ onContinue }: PaymentSuccessProps) {
  const { refetch } = useAccess()

  // Refetch access on mount to update client state
  useEffect(() => {
    refetch()
  }, [refetch])

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
          C'est bon, tu as accès.
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          Toutes les fonctionnalités sont maintenant débloquées.
          <br />
          Tu peux commencer à utiliser Ads Decision normalement.
        </p>

        {/* CTA */}
        <Link href="/dashboard">
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold"
          >
            Aller au Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}

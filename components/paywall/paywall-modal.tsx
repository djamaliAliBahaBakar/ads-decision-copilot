'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Zap } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PaywallModal({ isOpen, onClose, onSuccess }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly'>('monthly')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handlePayment = async () => {
    setLoading(true)
    try {
      // Redirect to Stripe Checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Payment error:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Accès complet à Ads Decision
            </h2>
          </div>

          <p className="text-gray-600 text-lg">
            Tu as vu ce que l'outil peut faire. Maintenant, utilise-le pour de vrai.
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Un cadre clair pour décider quoi faire de tes Ads.
          </p>
        </div>

        {/* Plans */}
        <div className="px-8 pb-6">
          <p className="text-xs text-blue-600 font-medium mb-4">
            Tarif early adopter — valable jusqu'au 28 février 2026
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedPlan === 'monthly'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <p className="text-2xl font-bold text-gray-900">29 €</p>
              <p className="text-sm text-gray-600">/mois</p>
            </button>

            {/* Quarterly */}
            <button
              onClick={() => setSelectedPlan('quarterly')}
              className={`
                p-4 rounded-xl border-2 text-left transition-all relative
                ${selectedPlan === 'quarterly'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span className="absolute -top-2 right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                -8 €
              </span>
              <p className="text-2xl font-bold text-gray-900">79 €</p>
              <p className="text-sm text-gray-600">/trimestre</p>
            </button>
          </div>
        </div>

        {/* What's included */}
        <div className="px-8 pb-6">
          <p className="text-sm font-medium text-gray-900 mb-3">Ce qui est inclus</p>
          <div className="space-y-2">
            {[
              'Suggestions de décision illimitées',
              'Journal de décisions complet',
              'Import CSV sans limite',
              'Règles personnalisées',
              'Digest hebdomadaire par email',
              'Mises à jour produit incluses',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What's not included */}
        <div className="px-8 pb-6">
          <p className="text-sm font-medium text-gray-500 mb-2">Non inclus</p>
          <div className="space-y-1">
            {[
              'Sync automatique avec Meta (prévu plus tard)',
              'Accès API',
              'Support prioritaire',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <X className="w-4 h-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 pt-4 bg-gray-50 border-t border-gray-100">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redirection...
              </span>
            ) : (
              'Débloquer l\'accès complet'
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Paiement sécurisé. Annulable à tout moment depuis les paramètres.
          </p>
        </div>
      </div>
    </div>
  )
}

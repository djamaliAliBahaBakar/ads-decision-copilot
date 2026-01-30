'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Zap, Sparkles } from 'lucide-react'

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
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold">
              Passe en mode Pro
            </h2>
          </div>

          <p className="text-white/90 text-lg">
            Arrête de douter. Décide plus vite, plus sereinement.
          </p>

          <p className="text-sm text-white/70 mt-2">
            Un cadre clair pour savoir quoi faire de chaque Ad.
          </p>
        </div>

        {/* Plans */}
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
              Tarif early adopter
            </p>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              Jusqu'au 28 février
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedPlan === 'monthly'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <p className="text-2xl font-bold text-gray-900">29 €</p>
              <p className="text-sm text-gray-600">/mois</p>
              <p className="text-xs text-gray-400 mt-1">Sans engagement</p>
            </button>

            {/* Quarterly */}
            <button
              onClick={() => setSelectedPlan('quarterly')}
              className={`
                p-4 rounded-xl border-2 text-left transition-all relative
                ${selectedPlan === 'quarterly'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span className="absolute -top-2 right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                Économise 8 €
              </span>
              <p className="text-2xl font-bold text-gray-900">79 €</p>
              <p className="text-sm text-gray-600">/trimestre</p>
              <p className="text-xs text-gray-400 mt-1">~26 €/mois</p>
            </button>
          </div>
        </div>

        {/* What's included */}
        <div className="px-8 pb-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Tout ce dont tu as besoin</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              'Décisions illimitées',
              'Journal complet',
              'Import CSV illimité',
              'Règles personnalisées',
              'Digest hebdo par email',
              'Toutes les mises à jour',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon - positive framing */}
        <div className="px-8 pb-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-semibold text-purple-700">Bientôt disponible</p>
            </div>
            <p className="text-xs text-purple-600/80">
              Sync automatique Meta Ads, accès API, et plus encore.
              <span className="font-medium"> Inclus dans ton abonnement.</span>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 pt-4 bg-gray-50 border-t border-gray-100">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redirection...
              </span>
            ) : (
              <>
                Débloquer l'accès Pro
                <Zap className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Paiement sécurisé par Stripe. Annulable en 1 clic.
          </p>
        </div>
      </div>
    </div>
  )
}

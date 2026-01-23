'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, AlertCircle, TrendingDown } from 'lucide-react'

interface Step4Props {
  uploadedData: any
  onComplete: () => void
}

interface WorstAd {
  adName: string
  cpl: number
  spend: number
  leads: number
  medianCpl: number
  percentAboveMedian: number
}

export default function OnboardingStep4({ uploadedData, onComplete }: Step4Props) {
  const [worstAd, setWorstAd] = useState<WorstAd | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Récupérer la pire ad
    async function fetchWorstAd() {
      try {
        const response = await fetch('/api/onboarding/worst-ad')
        if (!response.ok) throw new Error('Failed to fetch worst ad')

        const data = await response.json()
        setWorstAd(data)
      } catch (error) {
        console.error('Error fetching worst ad:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorstAd()
  }, [])

  const handleSaveDecision = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/onboarding/save-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worstAd }),
      })

      if (!response.ok) throw new Error('Failed to save decision')

      // Terminer l'onboarding
      onComplete()
    } catch (error) {
      console.error('Error saving decision:', error)
      alert('Erreur lors de la sauvegarde de la décision')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Analyse de vos campagnes...</p>
      </div>
    )
  }

  if (!worstAd) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucune campagne à analyser</p>
        <Button onClick={onComplete} className="mt-4">
          Terminer quand même
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Première décision</h2>
      <p className="text-gray-600 mb-6">
        Exemple de décision pré-remplie sur votre campagne la moins performante
      </p>

      <Card className="p-6 bg-red-50 border-2 border-red-200 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">🚨 Campagne identifiée</h3>
            <p className="text-xl font-bold text-red-900">{worstAd.adName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-white rounded border">
            <p className="text-sm text-gray-600">CPL actuel</p>
            <p className="text-lg font-bold text-red-600">€{worstAd.cpl.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-white rounded border">
            <p className="text-sm text-gray-600">CPL médian</p>
            <p className="text-lg font-bold">€{worstAd.medianCpl.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-white rounded border">
            <p className="text-sm text-gray-600">Dépensé</p>
            <p className="text-lg font-bold">€{worstAd.spend.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-white rounded border">
            <p className="text-sm text-gray-600">Leads</p>
            <p className="text-lg font-bold">{worstAd.leads}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded border border-red-300">
          <p className="text-sm font-medium mb-2">📋 Action recommandée :</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-red-600 text-white font-bold rounded">
              KILL
            </span>
            <span className="text-sm text-gray-600">
              Arrêter cette campagne
            </span>
          </div>

          <p className="text-sm font-medium mb-1">Raison :</p>
          <p className="text-sm text-gray-700">
            CPL supérieur de <strong>{worstAd.percentAboveMedian}%</strong> à la médiane.
            Cette campagne dépense votre budget sans résultats proportionnels.
          </p>
        </div>
      </Card>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>C'est un exemple :</strong> Dans votre usage quotidien, vous validerez chaque décision manuellement avant action.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveDecision} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer et terminer'
          )}
        </Button>
      </div>
    </div>
  )
}

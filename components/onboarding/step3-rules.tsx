'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface Step3Props {
  uploadedData: any
  onComplete: () => void
}

interface SuggestedRule {
  type: string
  threshold: number
  days: number
  description: string
  icon: string
}

export default function OnboardingStep3({ uploadedData, onComplete }: Step3Props) {
  const [rules, setRules] = useState<SuggestedRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Calculer les règles suggérées
    async function calculateRules() {
      try {
        const response = await fetch('/api/onboarding/calculate-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: uploadedData }),
        })

        if (!response.ok) throw new Error('Failed to calculate rules')

        const suggestedRules = await response.json()
        setRules(suggestedRules)
      } catch (error) {
        console.error('Error calculating rules:', error)
        // Règles par défaut si erreur
        setRules([
          {
            type: 'kill_if_cpl',
            threshold: 15,
            days: 3,
            description: 'Kill si CPL > €15 pendant 3 jours',
            icon: '🔴',
          },
          {
            type: 'scale_if_cpl',
            threshold: 8,
            days: 3,
            description: 'Scale si CPL < €8 pendant 3 jours',
            icon: '📈',
          },
          {
            type: 'analysis_window',
            threshold: 7,
            days: 7,
            description: 'Fenêtre d\'analyse : 7 jours',
            icon: '⏱️',
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    calculateRules()
  }, [uploadedData])

  const handleSaveRules = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/onboarding/save-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      })

      if (!response.ok) throw new Error('Failed to save rules')

      // Passer au step suivant
      onComplete()
    } catch (error) {
      console.error('Error saving rules:', error)
      alert('Erreur lors de la sauvegarde des règles')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Analyse de vos données...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Règles intelligentes</h2>
      <p className="text-gray-600 mb-6">
        Configuration automatique basée sur vos {uploadedData?.count || 0} lignes de données
      </p>

      <div className="space-y-4 mb-8">
        {rules.map((rule, index) => (
          <Card key={index} className="p-6 bg-blue-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{rule.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{rule.description}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Calculé automatiquement sur vos données</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <p className="text-sm text-yellow-800">
          💡 <strong>Astuce :</strong> Vous pourrez ajuster ces règles plus tard dans les paramètres
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveRules} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Enregistrement...
            </>
          ) : (
            'Valider les règles'
          )}
        </Button>
      </div>
    </div>
  )
}

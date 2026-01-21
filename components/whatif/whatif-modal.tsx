'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { calculateWhatIf } from '@/app/actions/whatif'
import { toast } from 'sonner'

interface WhatIfModalProps {
  isOpen: boolean
  onClose: () => void
  decisionId: string
  adName: string
  daysRunning: number
}

export function WhatIfModal({
  isOpen,
  onClose,
  decisionId,
  adName,
  daysRunning,
}: WhatIfModalProps) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(
    Math.max(1, daysRunning - 3)
  )

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await calculateWhatIf(decisionId, selectedDay)
      setResult(data)
    } catch (err) {
      setError('Erreur calcul what-if')
      toast.error('Erreur calcul what-if')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔮 What-If Scenario</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 fade-in">
          {/* Ad name */}
          <div>
            <p className="text-sm text-gray-600">Creative</p>
            <p className="font-semibold text-sm md:text-base">{adName}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Day selector */}
          {!result && !error && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Et si tu avais killé à J+{selectedDay} au lieu de J+{daysRunning} ?
                </label>
                <input
                  type="range"
                  min="1"
                  max={daysRunning}
                  value={selectedDay}
                  onChange={e => setSelectedDay(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>J+1</span>
                  <span className="font-semibold">J+{selectedDay}</span>
                  <span>J+{daysRunning}</span>
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full"
              >
                {loading ? '⏳ Calcul...' : '🔮 Calculer scénario'}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 slide-up">
              {/* Impact badge */}
              <div
                className={`p-3 md:p-4 rounded ${
                  result.savings > 100
                    ? 'bg-red-50 border border-red-200'
                    : result.savings < -100
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className="text-xs text-gray-600 mb-1">Impact</p>
                <p
                  className={`font-bold text-lg ${
                    result.savings > 100
                      ? 'text-red-600'
                      : result.savings < -100
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {result.impact}
                </p>
              </div>

              {/* Actual scenario */}
              <div className="border rounded p-4 bg-white">
                <h4 className="font-semibold mb-3 text-sm">
                  📊 Réel (J+{result.actualScenario.day})
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spend</span>
                    <span className="font-medium">€{result.actualScenario.spend.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leads</span>
                    <span className="font-medium">{result.actualScenario.leads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPL</span>
                    <span className="font-medium">€{result.actualScenario.cpl.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* What-if scenario */}
              <div className="border rounded p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold mb-3 text-sm">
                  ✨ Scénario (J+{result.whatIfScenario.day})
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spend</span>
                    <span className="font-medium">€{result.whatIfScenario.spend.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leads</span>
                    <span className="font-medium">{result.whatIfScenario.leads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPL</span>
                    <span className="font-medium">€{result.whatIfScenario.cpl.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Savings */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">💰 Économies potentielles</p>
                <p className="text-2xl font-bold text-blue-900">
                  €{result.savings.toFixed(0)}
                </p>
                <p className="text-xs text-blue-600 mt-2">{result.lesson}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Tester un autre jour
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
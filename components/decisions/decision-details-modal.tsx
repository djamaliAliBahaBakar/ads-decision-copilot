'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface DecisionDetailsModalProps {
  decision: any
  onClose: () => void
}

export function DecisionDetailsModal({ decision, onClose }: DecisionDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Détails de la décision</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Ad Info */}
          <div>
            <label className="text-xs font-semibold text-gray-600">AD</label>
            <p className="text-sm font-medium">{decision.adName}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">ANGLE</label>
            <p className="text-sm">{decision.angle}</p>
          </div>

          {/* Decision */}
          <div>
            <label className="text-xs font-semibold text-gray-600">ACTION</label>
            <p className="text-sm font-medium">{decision.action}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">RAISON</label>
            <p className="text-sm">{decision.reason}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">CPL</label>
              <p className="text-sm font-medium">€{decision.cplAtDecision.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">CONFIANCE</label>
              <p className="text-sm font-medium">{decision.confidence}/5</p>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-600">DATE</label>
            <p className="text-sm">
              {new Date(decision.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Results (si J+7 rempli) */}
          {decision.wasCorrect !== null && (
            <>
              <hr />
              <div>
                <label className="text-xs font-semibold text-gray-600">RÉSULTAT</label>
                <p className={`text-sm font-medium ${
                  decision.wasCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {decision.wasCorrect ? '✅ Bonne décision' : '❌ Mauvaise décision'}
                </p>
              </div>

              {decision.actualSavings && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">ÉCONOMIES</label>
                  <p className="text-sm font-medium">€{decision.actualSavings.toFixed(2)}</p>
                </div>
              )}

              {decision.postMortemNotes && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">NOTES</label>
                  <p className="text-xs text-gray-600">{decision.postMortemNotes}</p>
                </div>
              )}
            </>
          )}

          <Button onClick={onClose} className="w-full mt-4">
            Fermer
          </Button>
        </div>
      </Card>
    </div>
  )
}
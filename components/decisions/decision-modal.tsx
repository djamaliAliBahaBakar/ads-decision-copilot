'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface DecisionModalProps {
  ad: any
  onSave: (data: any) => void
  onClose: () => void
}

export function DecisionModal({ ad, onSave, onClose }: DecisionModalProps) {
  const [action, setAction] = useState(ad.action)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [confidence, setConfidence] = useState(3)

  const handleSave = () => {
    onSave({
      adId: ad.id,
      action,
      reason,
      notes,
      confidence,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Décision : {ad.adName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Action */}
          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="KILL">🔴 KILL</option>
              <option value="SCALE">🟢 SCALE</option>
              <option value="HOLD">🟡 HOLD</option>
              <option value="TEST">🔵 TEST</option>
              <option value="FIX">🟠 FIX</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-2">Raison</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Sélectionne --</option>
              <option value="FATIGUE">Fatigue audience</option>
              <option value="CPA_UP">CPA trop haut</option>
              <option value="CTR_DOWN">CTR en baisse</option>
              <option value="GOOD_ROAS">Bon ROAS</option>
              <option value="LEARNING">Phase learning</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Angle trop similaire à Creative B"
              className="w-full border rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Confiance : {confidence}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={e => setConfidence(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Sauvegarder
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
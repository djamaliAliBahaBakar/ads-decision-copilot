'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllDecisions } from '@/app/actions/decisions'
import { DecisionDetailsModal } from '@/components/decisions/decision-details-modal'

interface Decision {
  id: string
  adId: string
  adName: string
  angle: string
  action: string
  reason: string
  cplAtDecision: number
  confidence: number
  createdAt: Date
  actualSavings?: number
  wasCorrect?: boolean
  postMortemNotes?: string
}

export default function JournalPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('')
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchDecisions()
  }, [])

  const fetchDecisions = async () => {
    try {
      const data = await getAllDecisions()
      setDecisions(data)
    } catch (error) {
      console.error('Error fetching decisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDecisions = filterAction
    ? decisions.filter(d => d.action === filterAction)
    : decisions

  const handleViewDetails = (decision: Decision) => {
    setSelectedDecision(decision)
    setShowModal(true)
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Journal des Décisions</h1>
        <p className="text-gray-600">Historique de toutes tes décisions</p>
      </div>

      {/* Filtres */}
      <Card className="p-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filtrer par action :</label>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Toutes</option>
            <option value="KILL">🔴 KILL</option>
            <option value="SCALE">🟢 SCALE</option>
            <option value="HOLD">🟡 HOLD</option>
            <option value="TEST">🔵 TEST</option>
            <option value="FIX">🟠 FIX</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">
            {filteredDecisions.length} décision(s)
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6">
        {filteredDecisions.length === 0 ? (
          <p className="text-gray-500">Aucune décision pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Ad</th>
                  <th className="text-left p-2">Angle</th>
                  <th className="text-center p-2">Action</th>
                  <th className="text-left p-2">Raison</th>
                  <th className="text-right p-2">CPL</th>
                  <th className="text-right p-2">Confiance</th>
                  <th className="text-center p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDecisions.map(decision => (
                  <tr key={decision.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-xs">
                      {new Date(decision.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-2 font-medium">{decision.adName}</td>
                    <td className="p-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {decision.angle}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        decision.action === 'KILL' ? 'bg-red-100 text-red-800' :
                        decision.action === 'SCALE' ? 'bg-green-100 text-green-800' :
                        decision.action === 'HOLD' ? 'bg-yellow-100 text-yellow-800' :
                        decision.action === 'TEST' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {decision.action}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-gray-600">{decision.reason}</td>
                    <td className="p-2 text-right">€{decision.cplAtDecision.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <span className={`text-xs font-semibold ${
                        decision.confidence >= 4 ? 'text-green-600' :
                        decision.confidence >= 2 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {decision.confidence}/5
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        onClick={() => handleViewDetails(decision)}
                        size="sm"
                        variant="outline"
                      >
                        Détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">Total décisions</p>
          <p className="text-2xl font-bold">{decisions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">KILL</p>
          <p className="text-2xl font-bold text-red-600">
            {decisions.filter(d => d.action === 'KILL').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">SCALE</p>
          <p className="text-2xl font-bold text-green-600">
            {decisions.filter(d => d.action === 'SCALE').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-1">Confiance avg</p>
          <p className="text-2xl font-bold">
            {(decisions.length > 0
              ? (decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length).toFixed(1)
              : 0)}/5
          </p>
        </Card>
      </div>

      {showModal && selectedDecision && (
        <DecisionDetailsModal
          decision={selectedDecision}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAllDecisions } from '@/app/actions/decisions'
import { DecisionDetailsModal } from '@/components/decisions/decision-details-modal'
// import { WhatIfModal } from '@/components/whatif/whatif-modal' // MVP: Désactivé
import { DecisionRow } from '@/components/journal/decision-row'
import { TableSkeleton } from '@/components/ui/loading-skeleton'

interface Decision {
  id: string
  adId: string
  adName: string
  angle: string | null
  action: string
  reason: string
  cplAtDecision: number
  confidence: number | null
  createdAt: Date
  actualSavings?: number | null
  wasCorrect?: boolean | null
  postMortemNotes?: string | null
  followedRule?: boolean | null
  appliedRuleId?: string | null
}

export default function JournalPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<string>('')
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)
  const [showModal, setShowModal] = useState(false)

  // MVP: What-if désactivé
  // const [whatIfDecision, setWhatIfDecision] = useState<{
  //   id: string
  //   adName: string
  //   daysRunning: number
  // } | null>(null)

  useEffect(() => {
    fetchDecisions()
  }, [])

  const fetchDecisions = async () => {
    try {
      setError(null)
      const data = await getAllDecisions()
      setDecisions(data)
    } catch (err) {
      setError('Erreur chargement décisions')
      console.error('Error fetching decisions:', err)
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

  // MVP: What-if désactivé - fonction vide pour éviter erreur
  const handleWhatIf = (decision: Decision) => {
    // Désactivé pour MVP
    console.log('What-if désactivé pour MVP', decision.id)
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-semibold">❌ {error}</p>
          <Button
            onClick={fetchDecisions}
            className="mt-4"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 skeleton rounded w-96 mb-2"></div>
          <div className="h-4 skeleton rounded w-64"></div>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Journal des Décisions
        </h1>
        <p className="text-gray-600">Historique complet de vos décisions marketing</p>
      </div>

      {/* Filtres */}
      <Card className="p-4 md:p-6 slide-up">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <label className="text-sm font-medium">Filtrer :</label>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full md:w-auto"
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
      <Card className="p-4 md:p-6 slide-up">
        {filteredDecisions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">📭 Aucune décision pour le moment</p>
            <p className="text-gray-500 text-sm mt-2">
              Crée des décisions sur le Decision Board
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Ad</th>
                  <th className="text-left p-2 hidden md:table-cell">Angle</th>
                  <th className="text-center p-2">Action</th>
                  <th className="text-left p-2 hidden lg:table-cell">Raison</th>
                  <th className="text-right p-2">CPL</th>
                  <th className="text-right p-2">Conf.</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDecisions.map(decision => (
                  <DecisionRow
                    key={decision.id}
                    decision={decision}
                    onViewDetails={handleViewDetails}
                    onWhatIf={handleWhatIf}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-lg slide-up">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold">{decisions.length}</p>
        </Card>
        <Card className="p-4 hover:shadow-lg slide-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs text-gray-600 mb-1">KILL</p>
          <p className="text-2xl font-bold text-red-600">
            {decisions.filter(d => d.action === 'KILL').length}
          </p>
        </Card>
        <Card className="p-4 hover:shadow-lg slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs text-gray-600 mb-1">SCALE</p>
          <p className="text-2xl font-bold text-green-600">
            {decisions.filter(d => d.action === 'SCALE').length}
          </p>
        </Card>
        <Card className="p-4 hover:shadow-lg slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-xs text-gray-600 mb-1">Conf. avg</p>
          <p className="text-2xl font-bold">
            {(decisions.length > 0
              ? (decisions.reduce((sum, d) => sum + (d.confidence ?? 0), 0) / decisions.length).toFixed(1)
              : 0)}/5
          </p>
        </Card>
      </div>

      {/* Modals */}
      {showModal && selectedDecision && (
        <DecisionDetailsModal
          decision={selectedDecision}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* MVP: What-if modal désactivé
      {whatIfDecision && (
        <WhatIfModal
          isOpen={!!whatIfDecision}
          onClose={() => setWhatIfDecision(null)}
          decisionId={whatIfDecision.id}
          adName={whatIfDecision.adName}
          daysRunning={whatIfDecision.daysRunning}
        />
      )}
      */}
    </div>
  )
}
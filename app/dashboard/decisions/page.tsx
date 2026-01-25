'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDecisionSuggestions, logDecision, getDecisionsForAds } from '@/app/actions/decisions'
import { DecisionModal } from '@/components/decisions/decision-modal'
import { getActionLabel } from '@/lib/action-labels'

interface Suggestion {
  id: string
  adName: string
  campaignName: string
  angle: string
  cpl: number
  spend: number
  leads: number
  cplTrend3d: number
  daysRunning: number
  action: 'KILL' | 'SCALE' | 'HOLD' | 'REVIEW'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
}

interface DecisionRecord {
  id: string
  adId: string
  action: string
  createdAt: Date
}

export default function DecisionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAd, setSelectedAd] = useState<Suggestion | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [suggestionsData, decisionsData] = await Promise.all([
        getDecisionSuggestions(),
        getDecisionsForAds(),
      ])
      setSuggestions(suggestionsData)
      setDecisions(decisionsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecide = (ad: Suggestion) => {
    setSelectedAd(ad)
    setShowModal(true)
  }

  const handleSaveDecision = async (data: any) => {
    try {
      await logDecision(data)
      
      // Toast de confirmation
      alert(`✅ Décision ${data.action} sauvegardée`)
      
      // Refresh les données
      await fetchData()
      setShowModal(false)
      
    } catch (error) {
      console.error('Error saving decision:', error)
      alert('❌ Erreur en sauvegardant')
    }
  }

  // Check si un ad a déjà une décision
  const hasDecision = (adId: string) => {
    return decisions.some(d => d.adId === adId)
  }

  const getDecisionForAd = (adId: string) => {
    return decisions.find(d => d.adId === adId)
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Decision Board</h1>
        <p className="text-gray-600">Pas de données pour le moment</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Decision Board</h1>
        <p className="text-gray-600">Suggestions basées sur tes règles</p>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Ad</th>
                <th className="text-left p-2">Angle</th>
                <th className="text-right p-2">CPL</th>
                <th className="text-right p-2">Trend 3d</th>
                <th className="text-right p-2">Jours</th>
                <th className="text-center p-2">Recommandation</th>
                <th className="text-center p-2">Confiance</th>
                <th className="text-center p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map(ad => {
                const decision = getDecisionForAd(ad.id)
                const isDecided = hasDecision(ad.id)

                return (
                  <tr
                    key={ad.id}
                    className={`border-b hover:bg-gray-50 ${isDecided ? 'bg-gray-100 opacity-60' : ''}`}
                  >
                    <td className="p-2 font-medium">
                      {ad.adName}
                      {isDecided && <span className="ml-2 text-xs text-gray-500">✅ Décidé</span>}
                    </td>
                    <td className="p-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {ad.angle}
                      </span>
                    </td>
                    <td className="p-2 text-right">€{ad.cpl.toFixed(2)}</td>
                    <td className={`p-2 text-right ${ad.cplTrend3d > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {ad.cplTrend3d > 0 ? '+' : ''}{ad.cplTrend3d.toFixed(1)}%
                    </td>
                    <td className="p-2 text-right">{ad.daysRunning}d</td>
                    <td className="p-2 text-center">
                      {(() => {
                        const actionLabel = getActionLabel(ad.action)
                        return (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${actionLabel.bg} ${actionLabel.text}`}
                            title={actionLabel.tooltip}
                          >
                            {actionLabel.emoji} {ad.action}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`text-xs font-semibold ${
                        ad.confidence === 'HIGH' ? 'text-green-600' :
                        ad.confidence === 'MEDIUM' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {ad.confidence}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {isDecided ? (
                        <span className="text-xs text-gray-500">
                          {decision?.action} • {new Date(decision?.createdAt || '').toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleDecide(ad)}
                          size="sm"
                          variant="outline"
                        >
                          Décider
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && selectedAd && (
        <DecisionModal
          ad={selectedAd}
          onSave={handleSaveDecision}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
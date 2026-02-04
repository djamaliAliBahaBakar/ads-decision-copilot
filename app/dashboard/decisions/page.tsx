'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDecisionSuggestions, logDecision, getDecisionsForAds, getDecisionQuota } from '@/app/actions/decisions'
import { DecisionModal } from '@/components/decisions/decision-modal'
import { getActionLabel } from '@/lib/action-labels'
import { usePaywall } from '@/components/paywall'
import { Zap, TrendingUp, Mail, Target, ChevronRight } from 'lucide-react'

interface Suggestion {
  id: string
  adName: string
  campaignName: string | null
  cpl: number
  spend: number
  leads: number
  cplTrend3d: number
  daysRunning: number | null
  action: 'KILL' | 'SCALE' | 'HOLD' | 'REVIEW'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
  impact: string
  isAggregatedData?: boolean
}

interface DecisionRecord {
  id: string
  adId: string
  action: string
  createdAt: Date
}

interface DecisionQuota {
  isPaid: boolean
  used: number
  limit: number
  remaining: number
}

export default function DecisionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAd, setSelectedAd] = useState<Suggestion | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [quota, setQuota] = useState<DecisionQuota | null>(null)
  const { openPaywall } = usePaywall()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [suggestionsData, decisionsData, quotaData] = await Promise.all([
        getDecisionSuggestions(),
        getDecisionsForAds(),
        getDecisionQuota(),
      ])
      setSuggestions(suggestionsData)
      setDecisions(decisionsData)
      setQuota(quotaData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecide = (ad: Suggestion) => {
    // Si quota épuisé → ouvrir paywall directement
    if (quota && !quota.isPaid && quota.remaining <= 0) {
      openPaywall()
      return
    }

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

    } catch (error: any) {
      console.error('Error saving decision:', error)
      const errorMessage = error?.message || 'Erreur inconnue'

      // Détecter erreur de quota → Ouvrir le paywall directement
      if (
        errorMessage.includes('limite') ||
        errorMessage.includes('décisions gratuites') ||
        errorMessage.includes('abonnement') ||
        errorMessage.includes('payante') ||
        errorMessage.includes('Passez à la version')
      ) {
        setShowModal(false) // Fermer le modal de décision
        // Refresh quota pour afficher le bon état
        await fetchData()
        openPaywall() // Ouvrir le paywall
      } else {
        alert(`❌ Erreur: ${errorMessage}`)
      }
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

      {/* Quota Banner pour utilisateurs gratuits - Focus sur la VALEUR */}
      {quota && !quota.isPaid && (
        <div className={`rounded-xl overflow-hidden ${
          quota.remaining > 0
            ? 'bg-gradient-to-r from-slate-900 to-slate-800'
            : 'bg-gradient-to-r from-purple-600 to-blue-600'
        }`}>
          <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                {quota.remaining > 0 ? (
                  <>
                    {/* Still have free decisions */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < quota.used ? 'bg-slate-600' : 'bg-green-400'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-300">
                        {quota.remaining} décision{quota.remaining > 1 ? 's' : ''} gratuite{quota.remaining > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-white font-semibold mb-1">
                      Chaque décision compte. Utilise-les bien.
                    </p>
                    <p className="text-sm text-slate-400">
                      Passe Pro pour décider sans limite et suivre tes règles.
                    </p>
                  </>
                ) : (
                  <>
                    {/* No more free decisions - emphasize opportunity */}
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-300" />
                      <span className="text-yellow-300 font-semibold text-sm uppercase tracking-wide">
                        Opportunité
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Continue à optimiser ton budget
                    </h3>
                    <p className="text-blue-100 text-sm mb-3">
                      Tu as {suggestions.length} ad{suggestions.length > 1 ? 's' : ''} à décider.
                      Chaque mauvaise décision = budget gaspillé.
                    </p>

                    {/* Value propositions */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-white/80">
                        <Target className="w-3.5 h-3.5" /> Décisions illimitées
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white/80">
                        <Mail className="w-3.5 h-3.5" /> Digest hebdo
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white/80">
                        <TrendingUp className="w-3.5 h-3.5" /> Suivi discipline
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={openPaywall}
                className={`flex items-center gap-2 font-semibold px-5 py-2.5 h-auto ${
                  quota.remaining > 0
                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                    : 'bg-white text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                Passer Pro
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Ad</th>
                <th className="text-right p-2">CPL</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">Spend</th>
                <th className="text-center p-2">Recommandation</th>
                <th className="text-left p-2">Impact</th>
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
                    <td className="p-2">
                      <div className="font-medium">
                        {ad.adName}
                        {isDecided && <span className="ml-2 text-xs text-gray-500">✅</span>}
                      </div>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {ad.leads > 0 ? `€${ad.cpl.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 text-right">{ad.leads}</td>
                    <td className="p-2 text-right text-gray-600">€{ad.spend.toFixed(0)}</td>
                    <td className="p-2 text-center">
                      {(() => {
                        const actionLabel = getActionLabel(ad.action)
                        return (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${actionLabel.bg} ${actionLabel.text}`}
                            title={ad.reason}
                          >
                            {actionLabel.emoji} {ad.action}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="p-2 text-left">
                      <span className={`text-xs font-semibold ${
                        ad.action === 'KILL' ? 'text-red-600' :
                        ad.action === 'SCALE' ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {ad.impact}
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
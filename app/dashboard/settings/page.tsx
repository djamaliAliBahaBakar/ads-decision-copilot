'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUserRules, createUserRule, deleteUserRule } from '@/app/actions/rules'
import { DisciplineWidget } from '@/components/tiltmeter/discipline-widget'
import { MetaConnectButton } from '@/components/meta/meta-connect-button'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface UserRule {
  id: string
  ruleType: string
  threshold: number
  days: number
  isActive: boolean
}

export default function SettingsPage() {
  const [rules, setRules] = useState<UserRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRule, setNewRule] = useState({
    ruleType: 'kill_if_cpl',
    threshold: 10,
    days: 3,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setError(null)
      const data = await getUserRules()
      setRules(data)
    } catch (err) {
      setError('Erreur chargement règles')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = async () => {
    if (newRule.threshold <= 0 || newRule.days <= 0) {
      toast.error('Valeurs doivent être > 0')
      return
    }

    setIsSubmitting(true)
    try {
      await createUserRule({
        ruleType: newRule.ruleType,
        threshold: newRule.threshold,
        days: newRule.days,
      })
      setNewRule({ ruleType: 'kill_if_cpl', threshold: 10, days: 3 })
      await fetchRules()
      toast.success('Règle créée ✓')
    } catch (err) {
      toast.error('Erreur création règle')
      console.error('Error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteUserRule(ruleId)
      await fetchRules()
      toast.success('Règle supprimée ✓')
    } catch (err) {
      toast.error('Erreur suppression')
      console.error('Error:', err)
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-semibold">❌ {error}</p>
          <Button onClick={fetchRules} className="mt-4" variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">⚙️ Paramètres</h1>
        <p className="text-gray-600">Configure tes préférences et intégrations</p>
      </div>

      {/* Discipline Widget */}
      {!loading && <DisciplineWidget />}

      {/* 🔥 META API INTEGRATION */}
      <MetaConnectButton />

      {/* Créer nouvelle règle */}
      <Card className="p-6 slide-up">
        <h2 className="text-lg font-semibold mb-4">➕ Ajouter une règle</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de règle</label>
            <select
              value={newRule.ruleType}
              onChange={e => setNewRule({ ...newRule, ruleType: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="kill_if_cpl">Kill si CPL &gt;€</option>
              <option value="scale_if_roas">Scale si ROAS &gt;</option>
              <option value="hold_if_learning">Hold si learning (&lt;X jours)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seuil</label>
              <Input
                type="number"
                value={newRule.threshold}
                onChange={e => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                placeholder="Ex: 10"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jours</label>
              <Input
                type="number"
                value={newRule.days}
                onChange={e => setNewRule({ ...newRule, days: parseInt(e.target.value) })}
                placeholder="Ex: 3"
                className="text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleAddRule}
            disabled={isSubmitting}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Création...' : 'Ajouter règle'}
          </Button>
        </div>
      </Card>

      {/* Liste des règles */}
      <Card className="p-6 slide-up">
        <h2 className="text-lg font-semibold mb-4">📋 Tes règles actives</h2>

        {loading ? (
          <CardSkeleton />
        ) : rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune règle pour l'instant</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors slide-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm md:text-base">
                    {rule.ruleType === 'kill_if_cpl' && `Kill si CPL > €${rule.threshold}`}
                    {rule.ruleType === 'scale_if_roas' && `Scale si ROAS > ${rule.threshold}x`}
                    {rule.ruleType === 'hold_if_learning' && `Hold si learning`}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Pendant {rule.days} jours</p>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Docs */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 slide-up">
        <h3 className="font-semibold text-blue-900 mb-2">📖 Comment ça marche</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Connecte Meta → données sync auto chaque jour</li>
          <li>✓ Tes règles s'appliquent automatiquement</li>
          <li>✓ Plus tu suis tes règles, meilleur est ton ROI</li>
        </ul>
      </div>
    </div>
  )
}
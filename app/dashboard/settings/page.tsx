'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUserRules, createUserRule, deleteUserRule } from '@/app/actions/rules'
import { DisciplineWidget } from '@/components/tiltmeter/discipline-widget'
import { Trash2, Plus } from 'lucide-react'

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
  const [newRule, setNewRule] = useState({
    ruleType: 'kill_if_cpl',
    threshold: 10,
    days: 3,
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const data = await getUserRules()
      setRules(data)
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = async () => {
    try {
      await createUserRule({
        ruleType: newRule.ruleType,
        threshold: newRule.threshold,
        days: newRule.days,
      })
      setNewRule({ ruleType: 'kill_if_cpl', threshold: 10, days: 3 })
      await fetchRules()
    } catch (error) {
      console.error('Error creating rule:', error)
      alert('Erreur en créant la règle')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteUserRule(ruleId)
      await fetchRules()
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">⚙️ Tes Règles de Décision</h1>
        <p className="text-gray-600">Définis comment tes ads doivent être managées automatiquement</p>
      </div>

      {/* 🎯 DISCIPLINE WIDGET */}
      <DisciplineWidget />

      {/* Créer nouvelle règle */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Créer une nouvelle règle</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de règle</label>
            <select
              value={newRule.ruleType}
              onChange={e => setNewRule({ ...newRule, ruleType: e.target.value })}
              className="w-full border rounded px-3 py-2"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jours</label>
              <Input
                type="number"
                value={newRule.days}
                onChange={e => setNewRule({ ...newRule, days: parseInt(e.target.value) })}
                placeholder="Ex: 3"
              />
            </div>
          </div>

          <Button onClick={handleAddRule} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Ajouter règle
          </Button>
        </div>
      </Card>

      {/* Liste des règles */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tes règles actives</h2>

        {rules.length === 0 ? (
          <p className="text-gray-500">Aucune règle pour l'instant</p>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">
                    {rule.ruleType === 'kill_if_cpl' && `Kill si CPL > €${rule.threshold}`}
                    {rule.ruleType === 'scale_if_roas' && `Scale si ROAS > ${rule.threshold}x`}
                    {rule.ruleType === 'hold_if_learning' && `Hold si learning`}
                  </p>
                  <p className="text-sm text-gray-600">Pendant {rule.days} jours</p>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-500">
        💡 Les suggestions du Decision Board vont utiliser tes règles. Plus tu les suis, meilleur est ton ROI.
      </p>
    </div>
  )
}
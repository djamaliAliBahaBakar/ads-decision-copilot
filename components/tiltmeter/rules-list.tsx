'use client'

import { useEffect, useState } from 'react'
import { getUserRules, deleteUserRule } from '@/app/actions/rules'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export function RulesList() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getUserRules()
        setRules(data)
      } catch (error) {
        toast.error('Erreur chargement règles')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  async function handleDelete(ruleId: string) {
    try {
      await deleteUserRule(ruleId)
      setRules(rules.filter(r => r.id !== ruleId))
      toast.success('Règle supprimée ✓')
    } catch (error) {
      toast.error('Erreur suppression')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune règle. Ajoutes-en une ci-dessus.</p>
      ) : (
        rules.map((rule) => (
          <Card key={rule.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{rule.description}</p>
              <p className="text-xs text-slate-500">
                Seuil: {rule.threshold} | Jours: {rule.days}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(rule.id)}
            >
              Supprimer
            </Button>
          </Card>
        ))
      )}
    </div>
  )
}
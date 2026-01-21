'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { calculateDisciplineScore } from '@/app/actions/rules'

export function DisciplineWidget() {
  const [score, setScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const result = await calculateDisciplineScore()
        setScore(result)
      } catch (error) {
        console.error('Error fetching discipline score:', error)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [])

  if (loading) return <div>Chargement...</div>

  if (!score) return null

  const scoreColor = 
    score.percentage >= 70 ? 'text-green-600' : 
    score.percentage >= 50 ? 'text-yellow-600' : 
    'text-red-600'

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">🎯 Ta Discipline</h3>
          <p className="text-sm text-slate-600 mt-1">
            % de décisions conformes à tes règles
          </p>
        </div>

        <div className="text-right">
          <div className={`text-4xl font-bold ${scoreColor}`}>
            {score.percentage}%
          </div>
          <div className="text-sm text-slate-600 mt-1">
            {score.followed}/{score.total} bonnes
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-white rounded p-3 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{score.followed}</div>
          <div className="text-xs text-slate-600">Suivies</div>
        </div>
        <div className="bg-white rounded p-3 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{score.total - score.followed}</div>
          <div className="text-xs text-slate-600">Ignorées</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded border border-blue-300">
        <p className="text-xs text-blue-900">
          💡 Plus tu suis tes règles, meilleur est ton ROI (historiquement +10-15%)
        </p>
      </div>
    </Card>
  )
}
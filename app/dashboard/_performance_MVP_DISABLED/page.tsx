'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { getPerformanceByAngle } from '@/app/actions/performance'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AnglePerformance {
  angle: string
  avgCpl: number
  avgRoas: number
  adsCount: number
  totalSpend: number
  totalLeads: number
  bestCpl: number
  worstCpl: number
}

interface Insight {
  type: 'best' | 'worst' | 'comparison' | 'recommendation'
  text: string
}

export default function PerformancePage() {
  const [performance, setPerformance] = useState<AnglePerformance[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformance()
  }, [])

  const fetchPerformance = async () => {
    try {
      const data = await getPerformanceByAngle()
      setPerformance(data.angleStats)
      setInsights(data.insights)
    } catch (error) {
      console.error('Error fetching performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  if (performance.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Setup Performance</h1>
        <p className="text-gray-600">Pas de données pour le moment</p>
      </div>
    )
  }

  // Calcul du meilleur/pire angle
  const bestAngle = performance.reduce((prev, current) =>
    prev.avgCpl < current.avgCpl ? prev : current
  )
  const worstAngle = performance.reduce((prev, current) =>
    prev.avgCpl > current.avgCpl ? prev : current
  )

  // Calcul des économies potentielles
  const avgCplOverall = performance.reduce((sum, a) => sum + a.avgCpl, 0) / performance.length
  const totalSpend = performance.reduce((sum, a) => sum + a.totalSpend, 0)
  const potentialSavings = (worstAngle.avgCpl - bestAngle.avgCpl) * (totalSpend / avgCplOverall)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Setup Performance</h1>
        <p className="text-gray-600">Quel angle performe vraiment ?</p>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight, idx) => (
          <Card key={idx} className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">{insight.text}</p>
          </Card>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-xs text-gray-600 mb-2">Meilleur angle</p>
          <p className="text-xl font-bold">{bestAngle.angle}</p>
          <p className="text-sm text-green-600 mt-2">CPL €{bestAngle.avgCpl.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs text-gray-600 mb-2">Pire angle</p>
          <p className="text-xl font-bold">{worstAngle.angle}</p>
          <p className="text-sm text-red-600 mt-2">CPL €{worstAngle.avgCpl.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs text-gray-600 mb-2">Économies potentielles</p>
          <p className="text-xl font-bold text-green-600">€{potentialSavings.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-2">en évitant {worstAngle.angle}</p>
        </Card>
      </div>

      {/* CPL Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">CPL par Angle</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="angle" />
            <YAxis />
            <Tooltip formatter={(value) => `€${parseFloat(String(value)).toFixed(2)}`} />
            <Bar dataKey="avgCpl" fill="#3b82f6" name="CPL moyen" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ROAS Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">ROAS par Angle</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="angle" />
            <YAxis />
            <Tooltip formatter={(value) => `${parseFloat(String(value)).toFixed(2)}x`} />
            <Bar dataKey="avgRoas" fill="#10b981" name="ROAS moyen" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Détails par Angle</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Angle</th>
                <th className="text-right p-2"># Ads</th>
                <th className="text-right p-2">CPL moyen</th>
                <th className="text-right p-2">Best CPL</th>
                <th className="text-right p-2">Worst CPL</th>
                <th className="text-right p-2">ROAS moyen</th>
                <th className="text-right p-2">Spend total</th>
                <th className="text-right p-2">Leads total</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((angle, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{angle.angle}</td>
                  <td className="p-2 text-right">{angle.adsCount}</td>
                  <td className="p-2 text-right font-semibold">€{angle.avgCpl.toFixed(2)}</td>
                  <td className="p-2 text-right text-green-600">€{angle.bestCpl.toFixed(2)}</td>
                  <td className="p-2 text-right text-red-600">€{angle.worstCpl.toFixed(2)}</td>
                  <td className="p-2 text-right">{angle.avgRoas.toFixed(2)}x</td>
                  <td className="p-2 text-right">€{angle.totalSpend.toFixed(0)}</td>
                  <td className="p-2 text-right">{angle.totalLeads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-lg font-semibold mb-4 text-green-900">Recommandations</h2>
        <div className="space-y-2 text-sm text-green-800">
          <p>💡 <strong>Focus budget sur {bestAngle.angle}</strong> : CPL €{bestAngle.avgCpl.toFixed(2)} = meilleur ratio</p>
          <p>⚠️ <strong>Reduce ou stop {worstAngle.angle}</strong> : CPL €{worstAngle.avgCpl.toFixed(2)} = {((worstAngle.avgCpl / bestAngle.avgCpl) - 1) * 100}% plus cher</p>
          <p>🎯 <strong>Potential ROI</strong> : €{potentialSavings.toFixed(0)}/mois si tu arrêtes {worstAngle.angle}</p>
        </div>
      </Card>
    </div>
  )
}
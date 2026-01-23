'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getWeekData } from '@/app/actions/ads'
import Link from 'next/link'
// import { DisciplineWidget } from '@/components/tiltmeter/discipline-widget' // MVP: Désactivé
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Ad {
  id: string
  adName: string
  campaignName: string
  angle: string
  cpl: number
  spend: number
  leads: number
  ctr: number | null
  roas: number | null
  date: Date
}

interface WeekData {
  totalSpend: number
  totalLeads: number
  avgCpl: number
  avgRoas: number
  cplTrend: number
  ads: Ad[]
  graphData: { date: string; cpl: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const result = await getWeekData()
        setData(result)
      } catch (err) {
        setError('Erreur chargement données')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-semibold">❌ {error}</p>
          <Button
            onClick={() => window.location.reload()}
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
          <div className="h-8 skeleton rounded w-64 mb-2"></div>
          <div className="h-4 skeleton rounded w-96"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        <CardSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pas de données</h2>
          <p className="text-gray-600 max-w-md">
            Uploadez votre premier fichier CSV pour commencer à analyser vos campagnes Meta Ads
          </p>
          <Link href="/dashboard/upload">
            <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              📤 Upload CSV
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600">Vue d'ensemble de vos campagnes cette semaine</p>
      </div>

      {/* 4 Metrics Cards - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg slide-up">
          <p className="text-sm text-gray-600 mb-2">Spend</p>
          <p className="text-2xl font-bold">€{data.totalSpend.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-2">Cette semaine</p>
        </Card>

        <Card className="p-6 hover:shadow-lg slide-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-sm text-gray-600 mb-2">Leads</p>
          <p className="text-2xl font-bold">{data.totalLeads}</p>
          <p className="text-xs text-gray-500 mt-2">Conversions</p>
        </Card>

        <Card className="p-6 hover:shadow-lg slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-gray-600 mb-2">CPL moyen</p>
          <p className="text-2xl font-bold">€{data.avgCpl.toFixed(2)}</p>
          <p className={`text-xs mt-2 font-semibold ${data.cplTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data.cplTrend > 0 ? '📈' : '📉'} {Math.abs(data.cplTrend).toFixed(1)}%
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-gray-600 mb-2">ROAS moyen</p>
          <p className="text-2xl font-bold">{data.avgRoas.toFixed(2)}x</p>
          <p className="text-xs text-gray-500 mt-2">Retour investi</p>
        </Card>
      </div>

      {/* MVP: Discipline Widget désactivé pour simplifier
      <div className="slide-up" style={{ animationDelay: '0.4s' }}>
        <DisciplineWidget />
      </div>
      */}

      {/* Graph */}
      <Card className="p-6 hover:shadow-lg slide-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-lg font-semibold mb-4">CPL Evolution (7 jours)</h2>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={300} minWidth={250}>
            <LineChart data={data.graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="cpl"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6 hover:shadow-lg slide-up" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-lg font-semibold mb-4">Tes Ads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Ad</th>
                <th className="text-left p-2">Campaign</th>
                <th className="text-left p-2">Angle</th>
                <th className="text-right p-2">CPL</th>
                <th className="text-right p-2">Spend</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2 hidden md:table-cell">CTR</th>
                <th className="text-right p-2 hidden md:table-cell">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {data.ads.map((ad, idx) => (
                <tr
                  key={ad.id}
                  className="border-b hover:bg-blue-50 transition-colors"
                  style={{ animationDelay: `${0.7 + idx * 0.05}s` }}
                >
                  <td className="p-2 font-medium text-sm">{ad.adName}</td>
                  <td className="p-2 text-sm">{ad.campaignName}</td>
                  <td className="p-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {ad.angle}
                    </span>
                  </td>
                  <td className="p-2 text-right">€{ad.cpl.toFixed(2)}</td>
                  <td className="p-2 text-right">€{ad.spend.toFixed(0)}</td>
                  <td className="p-2 text-right">{ad.leads}</td>
                  <td className="p-2 text-right hidden md:table-cell">
                    {ad.ctr ? (ad.ctr * 100).toFixed(2) + '%' : '-'}
                  </td>
                  <td className="p-2 text-right hidden md:table-cell">
                    {ad.roas ? ad.roas.toFixed(2) + 'x' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CTA */}
      <Link href="/dashboard/upload">
        <Button variant="outline" className="w-full md:w-auto">
          📤 Upload plus de données
        </Button>
      </Link>
    </div>
  )
}
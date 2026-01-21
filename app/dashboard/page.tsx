'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getWeekData } from '@/app/actions/ads'
import Link from 'next/link'
import { DisciplineWidget } from '@/components/tiltmeter/discipline-widget'
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getWeekData()
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  if (!data) {
    return (
      <div className="p-8">
        <p>Pas de données. </p>
        <Link href="/dashboard/upload">
          <Button>Upload CSV</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de tes ads cette semaine</p>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Spend</p>
          <p className="text-2xl font-bold">€{data.totalSpend.toFixed(0)}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Leads</p>
          <p className="text-2xl font-bold">{data.totalLeads}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">CPL moyen</p>
          <p className="text-2xl font-bold">€{data.avgCpl.toFixed(2)}</p>
          <p className={`text-xs mt-2 ${data.cplTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data.cplTrend > 0 ? '↑' : '↓'} {Math.abs(data.cplTrend).toFixed(1)}% vs semaine avant
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">ROAS moyen</p>
          <p className="text-2xl font-bold">{data.avgRoas.toFixed(2)}x</p>
        </Card>
      </div>

       <DisciplineWidget />


      {/* Graph */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">CPL Evolution (7 jours)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cpl" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card className="p-6">
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
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {data.ads.map(ad => (
                <tr key={ad.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{ad.adName}</td>
                  <td className="p-2">{ad.campaignName}</td>
                  <td className="p-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {ad.angle}
                    </span>
                  </td>
                  <td className="p-2 text-right">€{ad.cpl.toFixed(2)}</td>
                  <td className="p-2 text-right">€{ad.spend.toFixed(0)}</td>
                  <td className="p-2 text-right">{ad.leads}</td>
                  <td className="p-2 text-right">
                    {ad.ctr ? (ad.ctr * 100).toFixed(2) + '%' : '-'}
                  </td>
                  <td className="p-2 text-right">
                    {ad.roas ? ad.roas.toFixed(2) + 'x' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Link href="/dashboard/upload">
        <Button variant="outline">Upload plus de données</Button>
      </Link>
    </div>
  )
}
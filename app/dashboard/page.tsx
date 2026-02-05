'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAdsPerformanceSummary } from '@/app/actions/ads'
import { getRealizedSavings, getDecisionQuota } from '@/app/actions/decisions'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowRight, Zap, Upload, CheckCircle2, Sparkles, Lock, Target, DollarSign, Users } from 'lucide-react'
import { usePaywall } from '@/components/paywall'

interface AdPerformance {
  name: string
  spend: number
  leads: number
  cpl: number
}

interface SummaryData {
  totalSpend: number
  totalLeads: number
  avgCpl: number
  adsCount: number
  topPerformers: AdPerformance[]
  worstPerformers: AdPerformance[]
  potentialSavings: number
  adsToDecide: number
}

interface SavingsData {
  realized: number
  potential: number
  decisionsCount: number
  adsToDecide: number
}

interface QuotaData {
  isPaid: boolean
  used: number
  limit: number
  remaining: number
}

export default function DashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [savings, setSavings] = useState<SavingsData | null>(null)
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const { openPaywall } = usePaywall()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryResult, savingsResult, quotaResult] = await Promise.all([
          getAdsPerformanceSummary(),
          getRealizedSavings(),
          getDecisionQuota(),
        ])
        setData(summaryResult)
        setSavings(savingsResult)
        setQuota(quotaResult)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
        setTimeout(() => setIsVisible(true), 100)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-2/3"></div>
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Pas de données → Inciter à uploader
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950 mb-3">
            Analyse tes performances ads
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-md">
            Importe tes données Meta Ads pour voir quelles pubs performent et lesquelles gaspillent ton budget.
          </p>
          <Link href="/dashboard/upload">
            <Button size="lg" className="bg-slate-950 hover:bg-slate-900">
              <Upload className="w-5 h-5 mr-2" />
              Importer mes données
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-2 tracking-tight">
          Résumé des performances
        </h1>
        <p className="text-lg text-slate-600 font-light">
          {data.adsCount} pub{data.adsCount > 1 ? 's' : ''} analysée{data.adsCount > 1 ? 's' : ''}
        </p>
      </div>

      {/* KPIs Cards */}
      <div className={`grid grid-cols-3 gap-4 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-950">{data.totalSpend.toFixed(0)}€</p>
          <p className="text-xs text-slate-500">Total dépensé</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-950">{data.totalLeads}</p>
          <p className="text-xs text-slate-500">Leads générés</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-950">{data.avgCpl.toFixed(2)}€</p>
          <p className="text-xs text-slate-500">CPL moyen</p>
        </Card>
      </div>

      {/* Top Performers */}
      {data.topPerformers.length > 0 && (
        <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-3">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Meilleures performances
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.topPerformers.map((ad, idx) => (
                <div key={ad.name} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm truncate max-w-[200px]" title={ad.name}>
                        {ad.name}
                      </p>
                      <p className="text-xs text-slate-500">{ad.leads} leads · {ad.spend.toFixed(0)}€</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{ad.cpl.toFixed(2)}€</p>
                    <p className="text-xs text-slate-400">CPL</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Worst Performers */}
      {data.worstPerformers.length > 0 && (
        <div className={`transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-3">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                À surveiller
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.worstPerformers.map((ad, idx) => (
                <div key={ad.name} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm truncate max-w-[200px]" title={ad.name}>
                        {ad.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ad.leads > 0 ? `${ad.leads} leads · ` : '0 lead · '}
                        {ad.spend.toFixed(0)}€ dépensé
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {ad.leads > 0 ? `${ad.cpl.toFixed(2)}€` : '—'}
                    </p>
                    <p className="text-xs text-slate-400">{ad.leads > 0 ? 'CPL' : 'Aucun lead'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Action Card - If there are potential savings */}
      {data.potentialSavings > 0 && (
        <div className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-white flex-shrink-0 mt-1" strokeWidth={2.5} />
                <div>
                  <p className="text-white text-sm font-semibold uppercase tracking-widest mb-1">
                    Opportunité
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    ~{data.potentialSavings}€ à récupérer
                  </h2>
                  <p className="text-orange-100 text-sm font-light mt-1">
                    Prends des décisions sur tes pubs sous-performantes
                  </p>
                </div>
              </div>
              <Link href="/dashboard/decisions">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold w-full md:w-auto"
                >
                  Voir les suggestions
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* All good state */}
      {data.potentialSavings === 0 && (
        <div className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="bg-gradient-to-r from-green-600 to-green-500 border-0 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
              <div>
                <h2 className="text-xl font-bold text-white">Tout est sous contrôle</h2>
                <p className="text-green-100 text-sm">Tes pubs performent bien. Continue comme ça !</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Savings Realized */}
      {savings && savings.realized > 0 && (
        <div className={`transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Économies réalisées</p>
                  <p className="text-2xl font-bold text-green-900">{savings.realized.toLocaleString()}€</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600">{savings.decisionsCount} décision{savings.decisionsCount > 1 ? 's' : ''} KILL</p>
                <p className="text-xs text-green-500">Budget réalloué aux winners</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Freemium Upgrade Teaser */}
      {quota && !quota.isPaid && (
        <div className={`transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border-2 border-dashed border-slate-300 bg-gradient-to-r from-slate-50 to-blue-50 p-6 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Version gratuite
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {quota.remaining > 0
                    ? `${quota.remaining} décision${quota.remaining > 1 ? 's' : ''} gratuite${quota.remaining > 1 ? 's' : ''} restante${quota.remaining > 1 ? 's' : ''}`
                    : 'Tu as utilisé tes 3 décisions gratuites'
                  }
                </h3>
                <p className="text-sm text-slate-600">
                  Passe Pro pour décisions illimitées + digest hebdo
                </p>
              </div>
              <Button
                onClick={openPaywall}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 h-auto whitespace-nowrap"
              >
                <Zap className="w-4 h-4 mr-2" />
                Passer Pro
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Secondary actions */}
      <div className={`flex gap-4 transition-all duration-700 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <Link href="/dashboard/upload" className="flex-1">
          <Button variant="outline" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Mettre à jour les données
          </Button>
        </Link>
        <Link href="/dashboard/decisions" className="flex-1">
          <Button variant="outline" className="w-full">
            Voir les suggestions
          </Button>
        </Link>
      </div>

    </div>
  )
}

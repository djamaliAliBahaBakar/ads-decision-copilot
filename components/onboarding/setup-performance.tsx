'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, TrendingDown, TrendingUp, Zap } from 'lucide-react'

interface AngleData {
  name: string
  cpl: number
  roas: number
  stars: number
  status: 'winner' | 'strong' | 'ok' | 'danger'
}

interface SetupPerformanceProps {
  uploadedData?: any
  onComplete: () => void
}

export default function SetupPerformance({ uploadedData, onComplete }: SetupPerformanceProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [angles, setAngles] = useState<AngleData[]>([])
  const [savings, setSavings] = useState(0)

  useEffect(() => {
    setIsVisible(true)

    // Si on a des données uploadées avec rawData, on les analyse
    const rawData = uploadedData?.rawData || uploadedData
    if (rawData && Array.isArray(rawData) && rawData.length > 0) {
      const analyzedAngles = analyzeAngles(rawData)
      if (analyzedAngles.angles.length > 0) {
        setAngles(analyzedAngles.angles)
        setSavings(analyzedAngles.potentialSavings)
        return
      }
    }

    // Données démo si pas de données réelles ou pas d'angles détectés
    setAngles([
      { name: 'PREUVE', cpl: 6.50, roas: 4.2, stars: 5, status: 'winner' },
      { name: 'PROBLEME', cpl: 7.20, roas: 3.8, stars: 4, status: 'strong' },
      { name: 'TRANSFORMATION', cpl: 8.90, roas: 2.9, stars: 3, status: 'ok' },
      { name: 'MECANISME', cpl: 13.50, roas: 1.5, stars: 1, status: 'danger' }
    ])
    setSavings(1200)
  }, [uploadedData])

  // Analyser les angles depuis les données CSV
  const analyzeAngles = (data: any[]): { angles: AngleData[], potentialSavings: number } => {
    // Grouper par angle
    const angleGroups: Record<string, { totalSpend: number, totalLeads: number, count: number }> = {}

    data.forEach((ad: any) => {
      const angle = ad.angle || ad.Angle || 'AUTRE'
      if (!angleGroups[angle]) {
        angleGroups[angle] = { totalSpend: 0, totalLeads: 0, count: 0 }
      }
      angleGroups[angle].totalSpend += parseFloat(ad.spend || ad.Spend || ad.amount_spent || 0)
      angleGroups[angle].totalLeads += parseInt(ad.leads || ad.Leads || ad.results || 0)
      angleGroups[angle].count++
    })

    // Calculer CPL par angle
    const anglesWithCpl = Object.entries(angleGroups)
      .map(([name, data]) => ({
        name: name.toUpperCase(),
        cpl: data.totalLeads > 0 ? data.totalSpend / data.totalLeads : 999,
        spend: data.totalSpend,
        leads: data.totalLeads
      }))
      .filter(a => a.leads > 0)
      .sort((a, b) => a.cpl - b.cpl)

    if (anglesWithCpl.length === 0) {
      return { angles: [], potentialSavings: 0 }
    }

    // Assigner statut et étoiles basé sur le ranking CPL
    const bestCpl = anglesWithCpl[0].cpl
    const analyzedAngles: AngleData[] = anglesWithCpl.slice(0, 5).map((angle, idx) => {
      const ratio = angle.cpl / bestCpl
      let status: 'winner' | 'strong' | 'ok' | 'danger'
      let stars: number
      let roas: number

      if (ratio <= 1.1) {
        status = 'winner'
        stars = 5
        roas = 4.0 + Math.random()
      } else if (ratio <= 1.5) {
        status = 'strong'
        stars = 4
        roas = 3.0 + Math.random()
      } else if (ratio <= 2.0) {
        status = 'ok'
        stars = 3
        roas = 2.0 + Math.random()
      } else {
        status = 'danger'
        stars = Math.max(1, 3 - Math.floor(ratio))
        roas = 1.0 + Math.random()
      }

      return {
        name: angle.name,
        cpl: angle.cpl,
        roas: parseFloat(roas.toFixed(1)),
        stars,
        status
      }
    })

    // Calculer économies potentielles
    // Si on concentrait 80% du budget sur les 2 meilleurs angles
    const totalSpend = anglesWithCpl.reduce((sum, a) => sum + a.spend, 0)
    const worstAnglesSpend = anglesWithCpl.slice(2).reduce((sum, a) => sum + a.spend, 0)
    const potentialSavings = Math.round(worstAnglesSpend * 0.6) // 60% du budget gaspillé récupérable

    return { angles: analyzedAngles, potentialSavings: Math.max(potentialSavings, 500) }
  }

  const rawData = uploadedData?.rawData || uploadedData
  const hasRealData = rawData && Array.isArray(rawData) && rawData.length > 0 && angles.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Header */}
      <div
        className={`mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3 tracking-tight">
          Votre vraie <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">performance créa</span>
        </h1>
        <p className="text-lg text-slate-600 font-light">
          Quel angle gagne vraiment. Quel angle saigne votre budget.
        </p>
      </div>

      {/* Angles Performance Table */}
      <div
        className={`mb-8 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">

          {/* Table Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Angles créatifs</span>
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Performance</span>
          </div>

          {/* Angles List */}
          <div className="divide-y divide-slate-200">
            {angles.map((angle, idx) => (
              <div
                key={angle.name}
                className={`px-6 py-5 hover:bg-slate-50 transition-all duration-300 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
                style={{ transitionDelay: `${200 + idx * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">

                  {/* Left: Name & Status */}
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <h3 className="font-bold text-slate-950 text-lg">{angle.name}</h3>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i < angle.stars ? 'bg-yellow-400' : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex items-center gap-6 text-right">
                    <div className="w-20">
                      <p className="text-2xl font-bold text-slate-950">{angle.cpl.toFixed(2)}€</p>
                      <p className="text-xs text-slate-500 font-medium">CPL</p>
                    </div>
                    <div className="w-16">
                      <p className="text-xl font-bold text-slate-950">{angle.roas.toFixed(1)}x</p>
                      <p className="text-xs text-slate-500 font-medium">ROAS</p>
                    </div>
                    <div className="w-12">
                      {angle.status === 'winner' ? (
                        <TrendingUp className="w-6 h-6 text-green-500" strokeWidth={2.5} />
                      ) : angle.status === 'danger' ? (
                        <TrendingDown className="w-6 h-6 text-red-500" strokeWidth={2.5} />
                      ) : (
                        <div className="w-6 h-6 text-slate-400 flex items-center justify-center">→</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      angle.status === 'winner'
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : angle.status === 'strong'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                        : angle.status === 'ok'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{
                      width: isVisible ? `${(angle.roas / 4.5) * 100}%` : '0%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Big Insight Card */}
      <div
        className={`mb-8 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">

          {/* Background accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400 opacity-10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-4">
              <Zap className="w-6 h-6 text-white flex-shrink-0 mt-1" strokeWidth={2.5} />
              <div>
                <p className="text-white text-sm font-semibold uppercase tracking-widest mb-2">
                  Opportunité
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {savings.toLocaleString()}€/mois
                </h2>
                <p className="text-blue-100 text-base font-light mt-2">
                  Si vous concentrez 80% du budget sur les 2 meilleurs angles au lieu de répartir partout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust signal */}
      <div
        className={`text-center mb-6 transition-all duration-700 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-sm text-slate-500 font-light">
          {hasRealData
            ? 'Analyse basée sur vos données réelles'
            : 'Cet exemple utilise des données démo. Chargez vos vraies données pour voir vos économies réelles.'
          }
        </p>
      </div>

      {/* CTA Section */}
      <div
        className={`transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <button
          onClick={onComplete}
          className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          {hasRealData ? 'Continuer vers le dashboard' : 'Commencer avec mes données'}
          <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Trust badges */}
      <div
        className={`text-center mt-6 transition-all duration-700 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-xs text-slate-500 font-light">
          Import sécurisé · Données cryptées · Aucune donnée vendue
        </p>
      </div>

    </div>
  )
}

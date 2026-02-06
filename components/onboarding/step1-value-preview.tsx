'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, TrendingDown, TrendingUp, Zap, Eye, Lock, Minus } from 'lucide-react'

interface AdDemo {
  name: string
  cpl: number
  spend: number
  leads: number
  action: 'KILL' | 'SCALE' | 'HOLD'
  blurred?: boolean
}

interface Step1ValuePreviewProps {
  onComplete: () => void
}

const actionStyles = {
  KILL: { bg: 'bg-red-100', text: 'text-red-700', label: 'KILL' },
  SCALE: { bg: 'bg-green-100', text: 'text-green-700', label: 'SCALE' },
  HOLD: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'HOLD' },
}

export default function Step1ValuePreview({ onComplete }: Step1ValuePreviewProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Données démo pour montrer la valeur
  const demoAds: AdDemo[] = [
    { name: 'Témoignage client V2', cpl: 6.50, spend: 320, leads: 49, action: 'SCALE' },
    { name: 'Offre lancement Mars', cpl: 14.80, spend: 445, leads: 30, action: 'KILL' },
    { name: '???', cpl: 8.90, spend: 210, leads: 24, action: 'HOLD', blurred: true },
    { name: '???', cpl: 18.50, spend: 370, leads: 20, action: 'KILL', blurred: true },
  ]

  const savings = 815

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Header avec promesse */}
      <div
        className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
          <Eye className="w-4 h-4" />
          Aperçu de vos résultats
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3 tracking-tight">
          Ta pire pub te coûte <br />
          <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            2x plus cher
          </span> que ta meilleure.
        </h1>
        <p className="text-lg text-slate-600 font-light">
          On te dit lesquelles garder, lesquelles couper.
        </p>
      </div>

      {/* Preview Table avec blur */}
      <div
        className={`mb-6 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">

          {/* Table Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Tes publicités</span>
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Verdict</span>
          </div>

          {/* Ads List */}
          <div className="divide-y divide-slate-200">
            {demoAds.map((ad, idx) => {
              const style = actionStyles[ad.action]
              return (
                <div
                  key={ad.name + idx}
                  className={`px-6 py-5 transition-all duration-300 ${
                    ad.blurred ? 'bg-slate-50' : 'hover:bg-slate-50'
                  } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                  style={{ transitionDelay: `${200 + idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between">

                    {/* Left: Name */}
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className={`font-bold text-base ${ad.blurred ? 'text-slate-400 blur-sm select-none' : 'text-slate-950'}`}>
                        {ad.blurred ? 'Ta publicité' : ad.name}
                      </h3>
                      <p className={`text-sm mt-1 ${ad.blurred ? 'text-slate-300 blur-sm' : 'text-slate-500'}`}>
                        {ad.spend}€ · {ad.leads} leads
                      </p>
                    </div>

                    {/* Right: CPL + Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${ad.blurred ? 'text-slate-400 blur-sm' : 'text-slate-950'}`}>
                          {ad.cpl.toFixed(2)}€
                        </p>
                        <p className="text-xs text-slate-500">CPL</p>
                      </div>
                      <div className="w-20">
                        {ad.blurred ? (
                          <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                        ) : (
                          <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold ${style.bg} ${style.text} w-full`}>
                            {style.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Big Insight Card */}
      <div
        className={`mb-6 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">

          {/* Background accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400 opacity-10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-white flex-shrink-0 mt-1" strokeWidth={2.5} />
              <div>
                <p className="text-white text-sm font-semibold uppercase tracking-widest mb-2">
                  En coupant les pubs sous-performantes
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  ~{savings}€/mois économisés
                </h2>
                <p className="text-blue-100 text-base font-light mt-2">
                  Budget réalloué aux pubs qui convertissent vraiment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        className={`transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <button
          onClick={onComplete}
          className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          Découvrir MES vrais résultats
          <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <p className="text-center text-sm text-slate-500 mt-4">
          Import rapide depuis Meta Ads Manager · 2 minutes
        </p>
      </div>

      {/* Trust badges */}
      <div
        className={`text-center mt-6 transition-all duration-700 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-xs text-slate-400 font-light">
          Données cryptées · Aucune donnée vendue · Conforme RGPD
        </p>
      </div>

    </div>
  )
}

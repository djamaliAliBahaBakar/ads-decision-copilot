'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, TrendingDown, TrendingUp, Zap, Eye, Lock } from 'lucide-react'

interface AngleData {
  name: string
  cpl: number
  roas: number
  stars: number
  status: 'winner' | 'strong' | 'ok' | 'danger'
  blurred?: boolean
}

interface Step1ValuePreviewProps {
  onComplete: () => void
}

export default function Step1ValuePreview({ onComplete }: Step1ValuePreviewProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Données démo pour montrer la valeur
  const demoAngles: AngleData[] = [
    { name: 'PREUVE', cpl: 6.50, roas: 4.2, stars: 5, status: 'winner' },
    { name: 'PROBLEME', cpl: 7.20, roas: 3.8, stars: 4, status: 'strong' },
    { name: '???', cpl: 8.90, roas: 2.9, stars: 3, status: 'ok', blurred: true },
    { name: '???', cpl: 13.50, roas: 1.5, stars: 1, status: 'danger', blurred: true }
  ]

  const savings = 1247

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
          Ton meilleur angle créatif <br />
          <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
            performe 2x mieux
          </span> que ton pire.
        </h1>
        <p className="text-lg text-slate-600 font-light">
          Nous le trouvons. Nous te montrons où pointer 80% de ton budget.
        </p>
      </div>

      {/* Preview Table avec blur */}
      <div
        className={`mb-6 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">

          {/* Table Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Tes angles créatifs</span>
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Performance</span>
          </div>

          {/* Angles List */}
          <div className="divide-y divide-slate-200">
            {demoAngles.map((angle, idx) => (
              <div
                key={angle.name + idx}
                className={`px-6 py-5 transition-all duration-300 ${
                  angle.blurred ? 'bg-slate-50' : 'hover:bg-slate-50'
                } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                style={{ transitionDelay: `${200 + idx * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">

                  {/* Left: Name & Status */}
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <h3 className={`font-bold text-lg ${angle.blurred ? 'text-slate-400 blur-sm select-none' : 'text-slate-950'}`}>
                        {angle.blurred ? 'TON ANGLE' : angle.name}
                      </h3>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i < angle.stars
                              ? angle.blurred ? 'bg-slate-300' : 'bg-yellow-400'
                              : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex items-center gap-6 text-right">
                    <div className="w-20">
                      <p className={`text-2xl font-bold ${angle.blurred ? 'text-slate-400 blur-sm' : 'text-slate-950'}`}>
                        {angle.cpl.toFixed(2)}€
                      </p>
                      <p className="text-xs text-slate-500 font-medium">CPL</p>
                    </div>
                    <div className="w-16">
                      <p className={`text-xl font-bold ${angle.blurred ? 'text-slate-400 blur-sm' : 'text-slate-950'}`}>
                        {angle.roas.toFixed(1)}x
                      </p>
                      <p className="text-xs text-slate-500 font-medium">ROAS</p>
                    </div>
                    <div className="w-12">
                      {angle.blurred ? (
                        <Lock className="w-5 h-5 text-slate-400" />
                      ) : angle.status === 'winner' ? (
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
                      angle.blurred
                        ? 'bg-slate-300'
                        : angle.status === 'winner'
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
                  En moyenne, nos utilisateurs découvrent
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {savings.toLocaleString()}€/mois
                </h2>
                <p className="text-blue-100 text-base font-light mt-2">
                  de budget gaspillé sur des angles qui ne convertissent pas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div
        className={`mb-8 transition-all duration-700 delay-600 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
          <div className="flex -space-x-2">
            {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'].map((color, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                {['M', 'S', 'A', 'J'][i]}
              </div>
            ))}
          </div>
          <span>+127 infopreneurs utilisent déjà Ads Decision</span>
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

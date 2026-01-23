'use client'

import { Button } from '@/components/ui/button'

interface Step2Props {
  onComplete: () => void
}

export default function OnboardingStep2({ onComplete }: Step2Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Tour rapide</h2>
      <p className="text-gray-600 mb-6">
        Découvrez les 3 sections principales
      </p>

      {/* TODO JOUR 2 : Ajouter les 3 cards de présentation */}
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">📊 Dashboard</h3>
          <p className="text-sm text-gray-600">
            Vue d'ensemble de vos métriques et tendances
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Decision Board</h3>
          <p className="text-sm text-gray-600">
            Suggestions automatiques d'actions sur vos campagnes
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">📝 Journal</h3>
          <p className="text-sm text-gray-600">
            Historique de vos décisions et résultats
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onComplete}>Continuer</Button>
      </div>
    </div>
  )
}

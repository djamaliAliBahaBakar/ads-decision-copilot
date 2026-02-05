'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { /* Wand2, */ Info } from 'lucide-react' // MVP: Wand2 désactivé
import { getActionLabel } from '@/lib/action-labels'

interface Decision {
  id: string
  adId: string
  adName: string
  angle: string | null
  action: string
  reason: string
  cplAtDecision: number
  confidence: number | null
  createdAt: Date
  actualSavings?: number | null
}

interface DecisionRowProps {
  decision: Decision
  onViewDetails: (decision: Decision) => void
  onWhatIf?: (decision: Decision) => void // MVP: Optional maintenant
}

const confidenceColors: Record<number, string> = {
  1: 'text-red-600',
  2: 'text-orange-600',
  3: 'text-yellow-600',
  4: 'text-blue-600',
  5: 'text-green-600',
}

export function DecisionRow({ decision, onViewDetails, onWhatIf }: DecisionRowProps) {
  const [formattedDate, setFormattedDate] = useState<string>('')

  useEffect(() => {
    const date = new Date(decision.createdAt)
    setFormattedDate(date.toLocaleDateString('fr-FR'))
  }, [decision.createdAt])

  const actionStyle = getActionLabel(decision.action)

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors fade-in">
      <td className="p-2 text-xs">{formattedDate}</td>
      <td className="p-2 font-medium text-sm truncate" title={decision.adName}>
        {decision.adName}
      </td>
      <td className="p-2 text-center">
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${actionStyle.bg} ${actionStyle.text}`}
          title={`${decision.action} - ${actionStyle.description}`}
        >
          {actionStyle.emoji}
        </span>
      </td>
      <td className="p-2 text-xs text-gray-600 hidden lg:table-cell truncate" title={decision.reason}>
        {decision.reason}
      </td>
      <td className="p-2 text-right text-sm">€{decision.cplAtDecision.toFixed(2)}</td>
      <td className="p-2 text-right text-sm">
        {decision.action === 'KILL' && decision.actualSavings ? (
          <span className="text-green-600 font-medium">+{decision.actualSavings}€</span>
        ) : decision.action === 'SCALE' ? (
          <span className="text-blue-600 font-medium">—</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="p-2 text-right">
        <span
          className={`text-xs font-bold ${confidenceColors[decision.confidence ?? 3] || confidenceColors[3]}`}
          title={`Confiance: ${decision.confidence ?? '-'}/5`}
        >
          {decision.confidence ?? '-'}⭐
        </span>
      </td>
      <td className="p-2 text-center space-x-1 flex justify-center">
        {/* MVP: What-If désactivé
        <Button
          onClick={() => onWhatIf(decision)}
          size="sm"
          variant="ghost"
          className="hover:bg-blue-50 p-1"
          title="Calculer What-If"
        >
          <Wand2 className="w-4 h-4" />
        </Button>
        */}

        <Button
          onClick={() => onViewDetails(decision)}
          size="sm"
          variant="ghost"
          className="hover:bg-gray-200 p-1"
          title="Voir détails"
        >
          <Info className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  )
}
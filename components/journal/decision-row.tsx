'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { /* Wand2, */ Info } from 'lucide-react' // MVP: Wand2 désactivé

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
}

interface DecisionRowProps {
  decision: Decision
  onViewDetails: (decision: Decision) => void
  onWhatIf?: (decision: Decision) => void // MVP: Optional maintenant
}

const actionLabels: Record<string, { bg: string; text: string; emoji: string }> = {
  KILL: { bg: 'bg-red-100', text: 'text-red-800', emoji: '🔴' },
  SCALE: { bg: 'bg-green-100', text: 'text-green-800', emoji: '🟢' },
  HOLD: { bg: 'bg-yellow-100', text: 'text-yellow-800', emoji: '🟡' },
  TEST: { bg: 'bg-blue-100', text: 'text-blue-800', emoji: '🔵' },
  FIX: { bg: 'bg-orange-100', text: 'text-orange-800', emoji: '🟠' },
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

  const actionStyle = actionLabels[decision.action] || actionLabels.HOLD

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors fade-in">
      <td className="p-2 text-xs">{formattedDate}</td>
      <td className="p-2 font-medium text-sm truncate" title={decision.adName}>
        {decision.adName}
      </td>
      <td className="p-2 hidden md:table-cell">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
          {decision.angle}
        </span>
      </td>
      <td className="p-2 text-center">
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${actionStyle.bg} ${actionStyle.text}`}
          title={decision.action}
        >
          {actionStyle.emoji}
        </span>
      </td>
      <td className="p-2 text-xs text-gray-600 hidden lg:table-cell truncate" title={decision.reason}>
        {decision.reason}
      </td>
      <td className="p-2 text-right text-sm">€{decision.cplAtDecision.toFixed(2)}</td>
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
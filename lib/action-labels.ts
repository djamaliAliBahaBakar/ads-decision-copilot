/**
 * Labels et explications pour les actions de décision
 * Termes anglais conservés + explications françaises pour accessibilité
 */

export type ActionType = 'KILL' | 'SCALE' | 'HOLD' | 'TEST' | 'FIX' | 'REVIEW'

export interface ActionLabel {
  /** Couleur de fond Tailwind */
  bg: string
  /** Couleur du texte Tailwind */
  text: string
  /** Emoji représentatif */
  emoji: string
  /** Explication courte en français */
  description: string
  /** Explication longue pour tooltip */
  tooltip: string
}

export const ACTION_LABELS: Record<ActionType, ActionLabel> = {
  KILL: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    emoji: '🔴',
    description: 'Couper cette pub',
    tooltip: 'Stopper immédiatement cette publicité qui perd de l\'argent',
  },
  SCALE: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    emoji: '🟢',
    description: 'Augmenter le budget',
    tooltip: 'Cette pub performe bien, augmenter le budget pour plus de résultats',
  },
  HOLD: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    emoji: '🟡',
    description: 'Surveiller',
    tooltip: 'Garder cette pub active et surveiller son évolution',
  },
  TEST: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    emoji: '🔵',
    description: 'Tester une variante',
    tooltip: 'Créer une nouvelle version pour tester (créatif, audience, etc.)',
  },
  FIX: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    emoji: '🟠',
    description: 'Optimiser',
    tooltip: 'Modifier le créatif, le ciblage ou le texte pour améliorer les résultats',
  },
  REVIEW: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    emoji: '⚪',
    description: 'À analyser',
    tooltip: 'Cette pub nécessite une analyse manuelle avant de décider',
  },
}

/**
 * Récupère le label d'une action avec fallback
 */
export function getActionLabel(action: string): ActionLabel {
  return ACTION_LABELS[action as ActionType] || ACTION_LABELS.REVIEW
}

/**
 * Liste des actions pour les formulaires/selects
 */
export const ACTION_OPTIONS = [
  { value: 'KILL', label: 'KILL', description: 'Couper cette pub' },
  { value: 'SCALE', label: 'SCALE', description: 'Augmenter le budget' },
  { value: 'HOLD', label: 'HOLD', description: 'Surveiller' },
  { value: 'TEST', label: 'TEST', description: 'Tester une variante' },
  { value: 'FIX', label: 'FIX', description: 'Optimiser' },
] as const

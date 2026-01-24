/**
 * i18n utilities for Ads Decision
 * Currently French-only, prepared for future multi-language support
 */

import { fr, type Translations } from './fr'

// Current locale (will be dynamic in future)
const currentLocale = 'fr'

// Available translations
const translations: Record<string, Translations> = {
  fr,
}

/**
 * Get translations for current locale
 */
export function t(): Translations {
  return translations[currentLocale] || fr
}

/**
 * Get a specific translation path
 * Usage: getT('nav.dashboard') => 'Tableau de bord'
 */
export function getT(path: string): string {
  const keys = path.split('.')
  let value: any = translations[currentLocale] || fr

  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) {
      console.warn(`Translation missing: ${path}`)
      return path
    }
  }

  return typeof value === 'string' ? value : path
}

export { fr }
export type { Translations }

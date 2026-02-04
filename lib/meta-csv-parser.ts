/**
 * Parser intelligent pour les exports CSV de Meta Ads Manager
 * Détecte automatiquement le format et mappe vers notre structure
 */

import Papa from 'papaparse'

export interface ParsedAd {
  ad_name: string
  campaign_name?: string
  ad_set_name?: string
  meta_ad_id?: string
  angle?: string
  cpl: number
  spend: number
  leads: number
  ctr?: number
  roas?: number
  date: string
}

export interface MetaParseResult {
  data: ParsedAd[]
  errors: string[]
  warnings: string[]
  detectedFormat: 'meta_report' | 'meta_export' | 'adsdecision' | 'unknown'
  mappedColumns: Record<string, string>
}

// Mapping des colonnes Meta vers notre format
// Indicateurs de résultats qui correspondent à des leads
const LEAD_RESULT_INDICATORS = [
  'leads',
  'lead',
  'offsite_conversion',
  'complete_registration',
  'contact',
  'submit_application',
  'subscribe',
  'conversion',
]

// Indicateurs de résultats qui NE SONT PAS des leads
const NON_LEAD_INDICATORS = [
  'link_click',
  'landing_page_view',
  'page_engagement',
  'post_engagement',
  'video_view',
  'impression',
  'reach',
  'click',
]

const COLUMN_MAPPINGS: Record<string, string[]> = {
  ad_name: [
    // Français
    'Nom de la publicité',
    'Nom de la publicitÃ©', // encodage cassé
    'Publicité',
    // English
    'Ad Name',
    'ad_name',
    // Deutsch
    'Anzeigenname',
    'Name der Werbeanzeige',
    // Español
    'Nombre del anuncio',
    // Italiano
    'Nome inserzione',
    // Português
    'Nome do anúncio',
    // Nederlands
    'Advertentienaam',
  ],
  meta_ad_id: [
    // Français
    'ID de la publicité',
    'ID de la publicitÃ©',
    'ID publicité',
    // English
    'Ad ID',
    'ad_id',
    'Ad id',
    // Deutsch
    'Anzeigen-ID',
    'Werbeanzeigen-ID',
    // Español
    'ID del anuncio',
    // Italiano
    'ID inserzione',
    // Português
    'ID do anúncio',
  ],
  campaign_name: [
    // Français
    'Nom de la campagne',
    'Campagne',
    // English
    'Campaign Name',
    'campaign_name',
    // Deutsch
    'Kampagnenname',
    // Español
    'Nombre de la campaña',
    // Italiano
    'Nome campagna',
    // Português
    'Nome da campanha',
  ],
  ad_set_name: [
    // Français
    "Nom de l'ensemble de publicités",
    'Ensemble de publicités',
    // English
    'Ad Set Name',
    'Ad set name',
    'ad_set_name',
    // Deutsch
    'Anzeigengruppenname',
    'Name der Anzeigengruppe',
    // Español
    'Nombre del conjunto de anuncios',
    // Italiano
    'Nome gruppo di inserzioni',
    // Português
    'Nome do conjunto de anúncios',
    // Patterns partiels (fallback)
    'ensemble de publicit',
    'ad set',
    'anzeigengruppe',
    'conjunto de anuncios',
  ],
  spend: [
    // Français
    'Montant dépensé (EUR)',
    'Montant dÃ©pensÃ© (EUR)',
    'Dépenses',
    // English
    'Amount Spent (EUR)',
    'Amount spent',
    'spend',
    // Deutsch
    'Ausgegebener Betrag',
    // Español
    'Importe gastado',
    // Italiano
    'Importo speso',
    // Português
    'Valor gasto',
    // Generic
    'Budget',
  ],
  leads: [
    // Français
    'Résultats',
    'RÃ©sultats',
    // English
    'Results',
    'Conversions',
    'leads',
    'Leads',
    'Actions',
    // Deutsch
    'Ergebnisse',
    // Español
    'Resultados',
    // Italiano
    'Risultati',
    // Português
    'Resultados',
  ],
  cpl: [
    // Français
    'Coût par résultat',
    'CoÃ»t par rÃ©sultat',
    // English
    'Cost per Result',
    'Cost per result',
    'cpl',
    'CPL',
    'CPA',
    // Deutsch
    'Kosten pro Ergebnis',
    // Español
    'Coste por resultado',
    // Italiano
    'Costo per risultato',
    // Português
    'Custo por resultado',
  ],
  ctr: [
    'CTR (tous)',
    'CTR',
    'ctr',
    'Click-Through Rate',
    // Français
    'Taux de clics',
    // Deutsch
    'Klickrate',
    // Español
    'Porcentaje de clics',
    // Italiano
    'Percentuale di clic',
  ],
  roas: [
    'ROAS',
    'roas',
    'Return on Ad Spend',
    // Deutsch
    'Rendite der Werbeausgaben',
    // Español
    'Retorno de la inversión publicitaria',
  ],
  date: [
    'date',
    'Date',
    // Français
    'Jour',
    'Fin des rapports',
    'Début des rapports',
    'DÃ©but des rapports',
    // English
    'Day',
    'Reporting starts',
    'Reporting ends',
    // Deutsch
    'Tag',
    'Berichtszeitraum endet',
    'Berichtszeitraum beginnt',
    // Español
    'Día',
    'Fecha',
    // Italiano
    'Giorno',
    'Data',
  ],
  impressions: [
    'Impressions',
    'impressions',
    // Deutsch
    'Impressionen',
    // Español/Italiano/Português
    'Impresiones',
    'Impressioni',
    'Impressões',
  ],
  result_indicator: [
    // Français
    'Indicateur de résultats',
    'Indicateur de rÃ©sultats',
    // English
    'Result Indicator',
    'Result Type',
    // Deutsch
    'Ergebnisindikator',
    // Español
    'Indicador de resultados',
  ],
  clicks: [
    // Français
    'Clics',
    // English
    'Clicks',
    'clicks',
    'Clics sur le lien',
  ],
}

/**
 * Détecte l'encodage et le séparateur du fichier
 */
function detectFileFormat(content: string): { separator: string; hasHeader: boolean } {
  // Détecter le séparateur
  const firstLine = content.split('\n')[0]

  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length

  let separator = ','
  if (tabCount > commaCount && tabCount > semicolonCount) {
    separator = '\t'
  } else if (semicolonCount > commaCount) {
    separator = ';'
  }

  return { separator, hasHeader: true }
}

/**
 * Nettoie le contenu du fichier (BOM, encodage, etc.)
 */
function cleanContent(content: string): string {
  // Supprimer BOM UTF-8
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1)
  }

  // Supprimer BOM UTF-16 LE (ÿþ)
  if (content.startsWith('ÿþ')) {
    content = content.slice(2)
  }

  // Supprimer les caractères null (UTF-16)
  content = content.replace(/\0/g, '')

  // Nettoyer les espaces excessifs entre caractères (UTF-16 mal décodé)
  if (content.includes(' C a m p a i g n')) {
    // UTF-16 mal décodé - chaque caractère est séparé par un espace
    content = content.split('').filter((_, i) => i % 2 === 0).join('')
  }

  return content.trim()
}

/**
 * Normalise une chaîne pour la comparaison (enlève les accents et caractères spéciaux)
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[âãäåàá]/g, 'a')
    .replace(/[êëèé]/g, 'e')
    .replace(/[îïìí]/g, 'i')
    .replace(/[ôõöòó]/g, 'o')
    .replace(/[ûüùú]/g, 'u')
    .replace(/[''`´]/g, "'")
    .replace(/[""]/g, '"')
    // Gérer les encodages cassés courants
    .replace(/ã©/g, 'e')
    .replace(/ã¨/g, 'e')
    .replace(/ã /g, 'a')
    .replace(/ã¢/g, 'a')
    .replace(/â/g, "'")
}

/**
 * Trouve le mapping des colonnes - retourne le NOM de la colonne (pas l'index)
 */
function findColumnMapping(headers: string[]): Record<string, string | undefined> {
  const mapping: Record<string, string | undefined> = {}

  for (const [targetField, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
    for (let i = 0; i < headers.length; i++) {
      const originalHeader = headers[i]?.trim() || ''
      const header = originalHeader.toLowerCase()
      const normalizedHeader = normalizeForComparison(header)

      for (const possibleName of possibleNames) {
        const normalizedName = normalizeForComparison(possibleName)
        if (
          header === possibleName.toLowerCase() ||
          header.includes(possibleName.toLowerCase()) ||
          normalizedHeader.includes(normalizedName)
        ) {
          // Stocker le nom ORIGINAL de la colonne (pas l'index)
          mapping[targetField] = originalHeader
          break
        }
      }

      if (mapping[targetField] !== undefined) break
    }
  }

  return mapping
}

/**
 * Parse un nombre depuis une chaîne (gère les formats français/anglais)
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value
  if (!value) return 0

  const str = String(value).trim()

  // Retirer les espaces et symboles monétaires
  let cleaned = str.replace(/[€$£\s]/g, '')

  // Gérer le format français (1 234,56) vs anglais (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Format anglais avec milliers
    cleaned = cleaned.replace(/,/g, '')
  } else if (cleaned.includes(',')) {
    // Format français
    cleaned = cleaned.replace(/,/g, '.')
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse une date depuis différents formats
 */
function parseDate(value: any): string {
  if (!value) {
    return new Date().toISOString().split('T')[0]
  }

  const str = String(value).trim()

  // Format ISO: 2025-11-01
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.split('T')[0]
  }

  // Format FR: 01/11/2025
  const frMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (frMatch) {
    return `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`
  }

  // Format US: 11/01/2025
  const usMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (usMatch) {
    // Essayer de deviner FR vs US
    const month = parseInt(usMatch[1])
    const day = parseInt(usMatch[2])
    if (month > 12) {
      // C'est forcément FR
      return `${usMatch[3]}-${usMatch[2]}-${usMatch[1]}`
    }
    // Assumer US par défaut
    return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`
  }

  // Essayer de parser avec Date
  try {
    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch {
    // ignore
  }

  return new Date().toISOString().split('T')[0]
}

/**
 * Parse un fichier CSV Meta
 */
export async function parseMetaCSV(content: string): Promise<MetaParseResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const data: ParsedAd[] = []

  // Nettoyer le contenu
  const cleanedContent = cleanContent(content)

  // Détecter le format
  const { separator } = detectFileFormat(cleanedContent)

  // Parser avec PapaParse
  const parseResult = Papa.parse(cleanedContent, {
    header: true,
    delimiter: separator,
    skipEmptyLines: true,
  })

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach(err => {
      warnings.push(`Ligne ${err.row}: ${err.message}`)
    })
  }

  const rows = parseResult.data as Record<string, any>[]
  const headers = parseResult.meta.fields || []

  if (rows.length === 0) {
    errors.push('Aucune donnée trouvée dans le fichier')
    return { data, errors, warnings, detectedFormat: 'unknown', mappedColumns: {} }
  }

  // Trouver le mapping des colonnes
  const columnMapping = findColumnMapping(headers)

  // Déterminer le format
  let detectedFormat: MetaParseResult['detectedFormat'] = 'unknown'

  if (columnMapping.ad_name !== undefined && columnMapping.spend !== undefined) {
    if (headers.some(h => h.toLowerCase().includes('résultat') || h.toLowerCase().includes('result'))) {
      detectedFormat = 'meta_report'
    } else if (headers.some(h => h.toLowerCase().includes('campaign id'))) {
      detectedFormat = 'meta_export'
    } else if (headers.includes('ad_name') && headers.includes('cpl')) {
      detectedFormat = 'adsdecision'
    } else {
      detectedFormat = 'meta_report'
    }
  }

  // Log des colonnes mappées (columnMapping contient maintenant les noms de colonnes)
  const mappedColumns: Record<string, string> = {}
  for (const [field, headerName] of Object.entries(columnMapping)) {
    if (headerName !== undefined) {
      mappedColumns[field] = headerName
    }
  }

  // Vérifier si les résultats sont des leads ou autre chose
  if (columnMapping.result_indicator) {
    const firstRow = rows[0] as Record<string, any> | undefined
    if (firstRow) {
      const indicator = firstRow[columnMapping.result_indicator]?.toString().toLowerCase() || ''

      const isLeadType = LEAD_RESULT_INDICATORS.some(li => indicator.includes(li))
      const isNonLeadType = NON_LEAD_INDICATORS.some(nli => indicator.includes(nli))

      if (isNonLeadType && !isLeadType) {
        warnings.push(`⚠️ ATTENTION: Vos résultats sont des "${indicator}" (clics/vues), pas des leads.`)
        warnings.push(`Pour un CPL précis, configurez Meta pour afficher les "Leads" ou "Conversions" comme résultat.`)
      }
    }
  }

  // Recommandation si l'ID de pub n'est pas présent
  if (!columnMapping.meta_ad_id) {
    warnings.push(`💡 CONSEIL: Ajoutez la colonne "ID de la publicité" dans votre export Meta pour un meilleur suivi des doublons.`)
  }

  // Vérifier les colonnes obligatoires
  if (columnMapping.ad_name === undefined) {
    errors.push('Colonne "Nom de la publicité" non trouvée')
  }
  if (columnMapping.spend === undefined) {
    errors.push('Colonne "Montant dépensé" non trouvée')
  }

  if (errors.length > 0) {
    // Suggérer le format attendu
    errors.push('')
    errors.push('Colonnes trouvées dans votre fichier :')
    headers.slice(0, 10).forEach(h => errors.push(`  - ${h}`))
    if (headers.length > 10) {
      errors.push(`  ... et ${headers.length - 10} autres colonnes`)
    }

    return { data, errors, warnings, detectedFormat, mappedColumns }
  }

  // Convertir les données - utiliser les noms de colonnes directement
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, any>

    try {
      // Accéder aux valeurs via le nom de colonne (pas l'index)
      const adName = columnMapping.ad_name ? row[columnMapping.ad_name]?.toString().trim() : undefined

      if (!adName) {
        warnings.push(`Ligne ${i + 2}: Nom de publicité vide, ignorée`)
        continue
      }

      const spend = parseNumber(columnMapping.spend ? row[columnMapping.spend] : 0)
      let leads = columnMapping.leads ? parseNumber(row[columnMapping.leads]) : 0
      let cpl = columnMapping.cpl ? parseNumber(row[columnMapping.cpl]) : 0

      // Calculer CPL si manquant
      if (cpl === 0 && leads > 0 && spend > 0) {
        cpl = spend / leads
      }

      // Calculer leads si manquant
      if (leads === 0 && cpl > 0 && spend > 0) {
        leads = Math.round(spend / cpl)
      }

      // Ignorer les lignes sans spend
      if (spend === 0) {
        warnings.push(`Ligne ${i + 2}: Dépenses à 0, ignorée`)
        continue
      }

      const parsedAd: ParsedAd = {
        ad_name: adName,
        campaign_name: columnMapping.campaign_name
          ? row[columnMapping.campaign_name]?.toString().trim()
          : undefined,
        ad_set_name: columnMapping.ad_set_name
          ? row[columnMapping.ad_set_name]?.toString().trim()
          : undefined,
        meta_ad_id: columnMapping.meta_ad_id
          ? row[columnMapping.meta_ad_id]?.toString().trim()
          : undefined,
        spend,
        leads,
        cpl: cpl || (spend / Math.max(leads, 1)),
        date: parseDate(columnMapping.date ? row[columnMapping.date] : null),
      }

      // Ajouter CTR si disponible
      if (columnMapping.ctr) {
        const ctr = parseNumber(row[columnMapping.ctr])
        if (ctr > 0) {
          parsedAd.ctr = ctr > 1 ? ctr / 100 : ctr // Convertir en décimal si %
        }
      }

      // Ajouter ROAS si disponible
      if (columnMapping.roas) {
        const roas = parseNumber(row[columnMapping.roas])
        if (roas > 0) {
          parsedAd.roas = roas
        }
      }

      data.push(parsedAd)
    } catch (err) {
      warnings.push(`Ligne ${i + 2}: Erreur de parsing - ${err}`)
    }
  }

  if (data.length === 0) {
    errors.push('Aucune donnée valide n\'a pu être extraite')
  }

  return { data, errors, warnings, detectedFormat, mappedColumns }
}

/**
 * Génère un aperçu du mapping détecté
 */
export function formatMappingPreview(result: MetaParseResult): string {
  const lines = [
    `Format détecté: ${result.detectedFormat}`,
    '',
    'Colonnes mappées:',
  ]

  for (const [field, column] of Object.entries(result.mappedColumns)) {
    lines.push(`  ${field} ← "${column}"`)
  }

  if (result.warnings.length > 0) {
    lines.push('')
    lines.push(`${result.warnings.length} avertissement(s)`)
  }

  return lines.join('\n')
}

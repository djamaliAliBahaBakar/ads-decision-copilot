import Papa from 'papaparse'
import { parseMetaCSV, formatMappingPreview } from './meta-csv-parser'

export interface AdRow {
  ad_name: string
  campaign_name?: string
  angle?: string
  cpl: number
  spend: number
  leads: number
  ctr?: number
  roas?: number
  date: string
}

export interface ParseError {
  line: number
  field: string
  value: any
  message: string
}

export interface ParseResult {
  data: AdRow[]
  errors: ParseError[]
  correctedCSV?: string
  // Nouvelles propriétés pour le parsing Meta
  detectedFormat?: 'meta_report' | 'meta_export' | 'adsdecision' | 'unknown'
  mappedColumns?: Record<string, string>
  mappingPreview?: string
}

/**
 * Parse un fichier CSV avec détection automatique du format Meta
 */
export async function parseCSV(csvText: string): Promise<ParseResult> {
  // Essayer d'abord le parser Meta intelligent
  try {
    const metaResult = await parseMetaCSV(csvText)

    // Si le parser Meta a trouvé des données valides
    if (metaResult.data.length > 0 && metaResult.errors.length === 0) {
      return {
        data: metaResult.data,
        errors: [],
        detectedFormat: metaResult.detectedFormat,
        mappedColumns: metaResult.mappedColumns,
        mappingPreview: formatMappingPreview(metaResult)
      }
    }

    // Si le parser Meta a trouvé des données mais avec des erreurs
    if (metaResult.data.length > 0) {
      // Convertir les warnings/errors Meta en ParseError
      const errors: ParseError[] = metaResult.warnings.map((warning, idx) => {
        const lineMatch = warning.match(/Ligne (\d+)/)
        return {
          line: lineMatch ? parseInt(lineMatch[1]) : idx + 2,
          field: 'parsing',
          value: null,
          message: warning
        }
      })

      return {
        data: metaResult.data,
        errors,
        detectedFormat: metaResult.detectedFormat,
        mappedColumns: metaResult.mappedColumns,
        mappingPreview: formatMappingPreview(metaResult)
      }
    }

    // Si le format n'est pas reconnu comme Meta, utiliser le parser strict
    if (metaResult.detectedFormat === 'unknown' || metaResult.errors.length > 0) {
      // Le parser Meta n'a pas réussi, essayer le parser original
      return parseCSVStrict(csvText)
    }
  } catch {
    // Si le parser Meta échoue, utiliser le parser original
  }

  return parseCSVStrict(csvText)
}

/**
 * Parser CSV strict (format AdsDecision original)
 */
function parseCSVStrict(csvText: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        const errors: ParseError[] = []
        const cleaned: AdRow[] = []

        // Vérifier les colonnes requises
        const headers = results.meta.fields || []
        const requiredColumns = ['ad_name', 'cpl', 'spend', 'leads', 'date']
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))

        if (missingColumns.length > 0) {
          reject(new Error(
            `❌ Colonnes manquantes : ${missingColumns.join(', ')}\n\n` +
            `Colonnes trouvées : ${headers.join(', ')}\n\n` +
            `💡 Ce fichier semble être un export Meta Ads Manager.\n` +
            `Le système va essayer de le convertir automatiquement...`
          ))
          return
        }

        // Valider chaque ligne
        data.forEach((row, index) => {
          const lineNumber = index + 2 // +2 car ligne 1 = headers

          // Vérifier ad_name
          if (!row.ad_name || row.ad_name.trim() === '') {
            errors.push({
              line: lineNumber,
              field: 'ad_name',
              value: row.ad_name,
              message: 'Le nom de la pub ne peut pas être vide'
            })
          }

          // Vérifier cpl (nombre positif)
          const cpl = parseFloat(row.cpl)
          if (isNaN(cpl) || cpl <= 0) {
            errors.push({
              line: lineNumber,
              field: 'cpl',
              value: row.cpl,
              message: `CPL invalide "${row.cpl}" - doit être un nombre positif (ex: 12.50)`
            })
          }

          // Vérifier spend (nombre positif)
          const spend = parseFloat(row.spend)
          if (isNaN(spend) || spend <= 0) {
            errors.push({
              line: lineNumber,
              field: 'spend',
              value: row.spend,
              message: `Dépense invalide "${row.spend}" - doit être un nombre positif (ex: 250)`
            })
          }

          // Vérifier leads (nombre entier positif)
          const leads = parseInt(row.leads)
          if (isNaN(leads) || leads <= 0) {
            errors.push({
              line: lineNumber,
              field: 'leads',
              value: row.leads,
              message: `Leads invalide "${row.leads}" - doit être un nombre entier positif (ex: 20)`
            })
          }

          // Vérifier date (format YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!row.date || !dateRegex.test(row.date)) {
            errors.push({
              line: lineNumber,
              field: 'date',
              value: row.date,
              message: `Date invalide "${row.date}" - format requis : YYYY-MM-DD (ex: 2026-01-20)`
            })
          }

          // Si toutes les validations passent, ajouter la ligne
          if (!errors.find(e => e.line === lineNumber)) {
            cleaned.push({
              ad_name: row.ad_name.trim(),
              campaign_name: row.campaign_name?.trim() || undefined,
              angle: row.angle?.trim() || undefined,
              cpl: parseFloat(row.cpl),
              spend: parseFloat(row.spend),
              leads: parseInt(row.leads),
              ctr: row.ctr ? parseFloat(row.ctr) : undefined,
              roas: row.roas ? parseFloat(row.roas) : undefined,
              date: row.date.trim(),
            })
          }
        })

        // Générer CSV corrigé si erreurs
        let correctedCSV: string | undefined
        if (errors.length > 0 && cleaned.length > 0) {
          const headers = 'ad_name,campaign_name,angle,cpl,spend,leads,ctr,roas,date'
          const rows = cleaned.map(row =>
            `${row.ad_name},${row.campaign_name || ''},${row.angle || ''},${row.cpl},${row.spend},${row.leads},${row.ctr || ''},${row.roas || ''},${row.date}`
          )
          correctedCSV = `${headers}\n${rows.join('\n')}`
        }

        resolve({ data: cleaned, errors, correctedCSV })
      },
      error: (error: Error) => reject(error),
    })
  })
}
const fs = require('fs')
const Papa = require('papaparse')

// Fonction parseNumber identique au parser
function parseNumber(value) {
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

// Normalisation comme dans meta-csv-parser.ts
function normalizeForComparison(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[âãäåàá]/g, 'a')
    .replace(/[êëèé]/g, 'e')
    .replace(/[îïìí]/g, 'i')
    .replace(/[ôõöòó]/g, 'o')
    .replace(/[ûüùú]/g, 'u')
    .replace(/[''`´]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/ã©/g, 'e')
    .replace(/ã¨/g, 'e')
    .replace(/ã /g, 'a')
    .replace(/ã¢/g, 'a')
    .replace(/â/g, "'")
}

// Lire le fichier CSV depuis le dossier courant (ou passer le chemin en argument)
const csvPath = process.argv[2] || './test.csv'

if (!fs.existsSync(csvPath)) {
  console.log('❌ Fichier non trouvé:', csvPath)
  console.log('\nUsage: node scripts/debug-csv-parsing.js <chemin-vers-csv>')
  process.exit(1)
}

const csvContent = fs.readFileSync(csvPath, 'utf-8')

console.log('=== DEBUG CSV PARSING ===\n')

// Détecter le séparateur
const firstLine = csvContent.split('\n')[0]
const tabCount = (firstLine.match(/\t/g) || []).length
const commaCount = (firstLine.match(/,/g) || []).length
const semicolonCount = (firstLine.match(/;/g) || []).length

let separator = ','
if (tabCount > commaCount && tabCount > semicolonCount) {
  separator = '\t'
} else if (semicolonCount > commaCount) {
  separator = ';'
}

console.log('Séparateur détecté:', separator === '\t' ? 'TAB' : separator)
console.log('')

// Parser avec PapaParse
const result = Papa.parse(csvContent, {
  header: true,
  delimiter: separator,
  skipEmptyLines: true,
})

const headers = result.meta.fields || []
console.log('=== COLONNES TROUVÉES ===')
headers.forEach((h, i) => {
  console.log(`  ${i}: "${h}"`)
})

// Chercher la colonne spend (exactement comme dans meta-csv-parser.ts)
const SPEND_COLUMNS = [
  'Montant dépensé (EUR)',
  'Montant dÃ©pensÃ© (EUR)',
  'Dépenses',
  'Amount Spent (EUR)',
  'Amount spent',
  'spend',
  'Ausgegebener Betrag',
  'Importe gastado',
  'Importo speso',
  'Valor gasto',
  'Budget',
]

let spendColumn = null
let matchedPattern = null
for (const col of SPEND_COLUMNS) {
  for (const h of headers) {
    const header = h.toLowerCase()
    const normalizedHeader = normalizeForComparison(header)
    const normalizedCol = normalizeForComparison(col)

    if (
      header === col.toLowerCase() ||
      header.includes(col.toLowerCase()) ||
      normalizedHeader.includes(normalizedCol)
    ) {
      spendColumn = h
      matchedPattern = col
      break
    }
  }
  if (spendColumn) break
}

console.log('\n=== MAPPING SPEND ===')
if (spendColumn) {
  console.log('Colonne spend trouvée:', `"${spendColumn}"`)
  console.log('Pattern correspondant:', `"${matchedPattern}"`)
} else {
  console.log('Colonne spend: ❌ NON TROUVÉE')
  console.log('\nColonnes contenant "spend", "dépens", "montant":')
  headers.filter(h =>
    h.toLowerCase().includes('spend') ||
    h.toLowerCase().includes('dépens') ||
    h.toLowerCase().includes('montant') ||
    h.toLowerCase().includes('amount')
  ).forEach(h => console.log(`  - "${h}"`))
}

// Afficher les caractères hex pour debug encoding
console.log('\n=== ENCODAGE DES COLONNES (pour debug) ===')
headers.slice(0, 5).forEach(h => {
  const hexCodes = [...h].map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ')
  console.log(`"${h}"`)
  console.log(`  Hex: ${hexCodes}`)
})

// Afficher les données brutes
console.log('\n=== DONNÉES BRUTES (5 premières lignes) ===')
const rows = result.data.slice(0, 5)

rows.forEach((row, i) => {
  console.log(`\n--- Ligne ${i + 1} ---`)

  // Afficher les valeurs clés
  const adNameCol = headers.find(h =>
    h.toLowerCase().includes('nom de la publicité') ||
    h.toLowerCase().includes('ad name')
  )
  const leadsCol = headers.find(h =>
    h.toLowerCase().includes('résultat') ||
    h.toLowerCase().includes('results')
  )

  if (adNameCol) console.log(`  Nom pub: "${row[adNameCol]}"`)
  if (spendColumn) {
    const rawValue = row[spendColumn]
    const parsedValue = parseNumber(rawValue)
    console.log(`  Spend brut: "${rawValue}" → Parsé: ${parsedValue}`)
  }
  if (leadsCol) console.log(`  Leads: "${row[leadsCol]}"`)
})

// Calculer le total spend
if (spendColumn) {
  console.log('\n=== TOTAL SPEND ===')
  const allRows = result.data
  const totalSpend = allRows.reduce((sum, row) => {
    const value = parseNumber(row[spendColumn])
    return sum + value
  }, 0)

  console.log(`Nombre de lignes: ${allRows.length}`)
  console.log(`Total spend calculé: €${totalSpend.toFixed(2)}`)

  console.log('\nDétail par ligne:')
  allRows.forEach((row, i) => {
    const adName = row[headers.find(h => h.toLowerCase().includes('nom de la publicité') || h.toLowerCase().includes('ad name'))] || `Ligne ${i}`
    const rawSpend = row[spendColumn]
    const parsedSpend = parseNumber(rawSpend)
    console.log(`  ${i + 1}. "${adName}": "${rawSpend}" → €${parsedSpend}`)
  })
}

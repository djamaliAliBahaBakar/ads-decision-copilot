'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { parseCSV, ParseError } from '@/lib/csv-parser'
import { Upload, FileText, Download, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

interface Step1Props {
  onComplete: (data: any) => void
}

export default function OnboardingStep1({ onComplete }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedRows, setUploadedRows] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStats, setUploadStats] = useState<any>(null)
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [correctedCSV, setCorrectedCSV] = useState<string | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)
  const [mappedColumns, setMappedColumns] = useState<Record<string, string> | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setParseErrors([])
    setCorrectedCSV(null)
    setDetectedFormat(null)
    setMappedColumns(null)
    setWarnings([])

    try {
      // Lire le fichier
      const text = await file.text()

      // Parser avec csv-parser.ts amélioré (supporte Meta)
      const result = await parseCSV(text)

      // Stocker le format détecté et les colonnes mappées
      if (result.detectedFormat) {
        setDetectedFormat(result.detectedFormat)
      }
      if (result.mappedColumns) {
        setMappedColumns(result.mappedColumns)
      }
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
      }

      // S'il y a des erreurs de parsing
      if (result.errors.length > 0) {
        setParseErrors(result.errors)
        setCorrectedCSV(result.correctedCSV || null)

        // Si aucune donnée valide
        if (result.data.length === 0) {
          throw new Error(
            `❌ Impossible d'importer le fichier : ${result.errors.length} erreur(s) détectée(s)\n\n` +
            `Consultez les détails ci-dessous pour corriger votre fichier.`
          )
        }

        // S'il y a des données valides ET des erreurs
        throw new Error(
          `⚠️ Import partiel : ${result.errors.length} ligne(s) ignorée(s)\n\n` +
          `${result.data.length} ligne(s) valide(s) ont été trouvées, mais certaines lignes contiennent des erreurs.\n\n` +
          `Consultez les détails ci-dessous.`
        )
      }

      // Validation : minimum 7 jours de données
      const uniqueDates = new Set(result.data.map(r => r.date))
      if (uniqueDates.size < 7) {
        throw new Error(
          `❌ Pas assez de données\n\n` +
          `Le fichier contient seulement ${uniqueDates.size} jour(s) de données.\n` +
          `Minimum requis : 7 jours différents.\n\n` +
          `💡 Astuce : Téléchargez le template qui contient 14 jours de données exemples.`
        )
      }

      // Envoyer au backend
      const response = await fetch('/api/onboarding/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: result.data }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement des données')
      }

      const apiResult = await response.json()

      setUploadedRows(apiResult.count)
      setUploadStats(apiResult)

      // Ne pas passer automatiquement au step suivant
      // L'utilisateur doit confirmer en cliquant sur "C'est correct"

    } catch (err: any) {
      setError(err.message || 'Erreur lors du parsing du CSV')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Générer 14 jours de données réalistes
    const today = new Date()
    const rows: string[] = []

    // Campagnes avec différents niveaux de performance
    const campaigns = [
      { name: 'Campagne Webinaire', angle: 'PROBLEME', baseCpl: 12, baseSpend: 80 },
      { name: 'Campagne Lead Magnet', angle: 'MECANISME', baseCpl: 8, baseSpend: 60 },
      { name: 'Campagne Démo Gratuite', angle: 'PREUVE', baseCpl: 15, baseSpend: 100 },
    ]

    // Générer 14 jours de données pour chaque campagne
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      campaigns.forEach((campaign, idx) => {
        // Variation réaliste jour par jour
        const variation = 1 + (Math.random() * 0.4 - 0.2) // ±20%
        const cpl = (campaign.baseCpl * variation).toFixed(2)
        const spend = Math.round(campaign.baseSpend * variation)
        const leads = Math.round(spend / parseFloat(cpl))
        const ctr = (1.0 + Math.random() * 0.5).toFixed(2)
        const roas = (2.0 + Math.random()).toFixed(1)

        rows.push(
          `Ad ${idx + 1} - Jour ${14 - i},${campaign.name},${campaign.angle},${cpl},${spend},${leads},${ctr},${roas},${dateStr}`
        )
      })
    }

    const template = `# INSTRUCTIONS : Ce fichier est pré-rempli avec 14 jours de données exemples (42 lignes)
# Vous pouvez soit :
#   1. MODIFIER les données directement dans ce fichier (remplacer par vos vraies données)
#   2. COPIER vos données depuis Excel et remplacer tout (sauf la ligne d'en-têtes)
#   3. UTILISER tel quel pour tester l'outil
#
# COLONNES OBLIGATOIRES : ad_name, cpl, spend, leads, date
# COLONNES OPTIONNELLES : campaign_name, angle, ctr, roas
#
# FORMAT :
#   - cpl : Coût par Lead en euros (ex: 12.50)
#   - spend : Dépenses en euros (ex: 250)
#   - leads : Nombre de conversions (ex: 20)
#   - date : Format YYYY-MM-DD (ex: 2026-01-20)
#   - angle : PROBLEME, MECANISME ou PREUVE
#
# ⚠️ NE PAS SUPPRIMER LA LIGNE CI-DESSOUS (en-têtes des colonnes)
ad_name,campaign_name,angle,cpl,spend,leads,ctr,roas,date
${rows.join('\n')}`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_adsdecision.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Import de vos données Ads</h2>
      <p className="text-gray-600 mb-4">
        Importez vos données Meta Ads (minimum 7 jours)
      </p>

      {/* Instructions Meta Ads Manager */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="font-semibold text-blue-900 mb-2">📊 Comment exporter depuis Meta Ads Manager :</p>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Aller dans Meta Ads Manager → sélectionner votre compte</li>
          <li><strong>Important :</strong> Se positionner au niveau <strong>"Publicités"</strong> (pas Campagnes, pas Ensembles)</li>
          <li>Sélectionner les <strong>7 derniers jours minimum</strong></li>
          <li>Cliquer sur "Exporter" → "Exporter les données du tableau"</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          💡 Astuce : Ajoutez la colonne "Nom de la campagne" pour un meilleur suivi
        </p>
      </div>

      {/* Bouton télécharger template */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Télécharger le template CSV (optionnel)
        </Button>
      </div>

      {/* Zone de drop */}
      {!uploadedRows && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center
            transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
            disabled={uploading}
          />
          
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {uploading ? (
              <>
                <FileText className="w-12 h-12 text-gray-400 mb-4 animate-pulse" />
                <p className="text-gray-600">Import en cours...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">
                  Glissez votre fichier CSV ici
                </p>
                <p className="text-sm text-gray-500">
                  ou cliquez pour sélectionner un fichier
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Écran de vérification post-import */}
      {uploadedRows && uploadStats && (
        <div className="space-y-6">
          {/* Header de confirmation */}
          <div className="flex items-center justify-center gap-3 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Import réussi!</h3>
              <p className="text-sm text-green-700">
                {detectedFormat && detectedFormat !== 'adsdecision'
                  ? `Export ${detectedFormat === 'meta_report' ? 'Meta Ads Manager' : 'Meta'} détecté et converti automatiquement`
                  : 'Vérifiez les données ci-dessous'}
              </p>
            </div>
          </div>

          {/* Afficher le mapping détecté si c'est un export Meta */}
          {mappedColumns && Object.keys(mappedColumns).length > 0 && detectedFormat !== 'adsdecision' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Colonnes mappées automatiquement
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(mappedColumns).map(([field, column]) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="text-blue-700 font-mono">{column}</span>
                    <span className="text-blue-500">→</span>
                    <span className="text-blue-900 font-medium">{field}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Afficher les avertissements */}
          {warnings.length > 0 && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Avertissements
              </h4>
              <div className="space-y-1">
                {warnings.map((warning, idx) => (
                  <p key={idx} className="text-sm text-amber-800">{warning}</p>
                ))}
              </div>
            </div>
          )}

          {/* Stats en grille */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-900">{uploadStats.campaignsCount}</p>
              <p className="text-sm text-blue-700 mt-1">campagnes importées</p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-900">{uploadStats.totalLeads}</p>
              <p className="text-sm text-purple-700 mt-1">leads générés</p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <p className="text-3xl font-bold text-orange-900">€{Math.round(uploadStats.totalSpend)}</p>
              <p className="text-sm text-orange-700 mt-1">dépenses totales</p>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-center">
              <p className="text-sm text-teal-900 font-semibold">
                {new Date(uploadStats.minDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                {' - '}
                {new Date(uploadStats.maxDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-teal-700 mt-1">période</p>
            </div>
          </div>

          {/* Détails supplémentaires */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>{uploadedRows} lignes</strong> de données importées
            </p>
            <p className="text-sm text-gray-600 mt-1">
              CPL moyen : <strong>€{uploadStats.avgCpl.toFixed(2)}</strong>
            </p>
          </div>

          {/* Bouton de confirmation */}
          <Button
            onClick={() => onComplete(uploadStats)}
            size="lg"
            className="w-full"
          >
            ✅ C'est correct, continuer
          </Button>
        </div>
      )}

      {/* Erreur avec détails */}
      {error && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 text-sm whitespace-pre-line font-medium">
                  {error}
                </p>
              </div>
            </div>
          </div>

          {/* Détails des erreurs ligne par ligne */}
          {parseErrors.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Détails des erreurs ({parseErrors.length} ligne{parseErrors.length > 1 ? 's' : ''})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parseErrors.slice(0, 10).map((err, idx) => (
                  <div key={idx} className="text-sm bg-white p-3 rounded border border-orange-200">
                    <p className="font-mono text-orange-900">
                      <strong>Ligne {err.line}</strong> - Colonne "{err.field}"
                    </p>
                    <p className="text-orange-800 mt-1">{err.message}</p>
                    {err.value !== undefined && err.value !== null && (
                      <p className="text-orange-600 mt-1 font-mono text-xs">
                        Valeur actuelle : "{err.value}"
                      </p>
                    )}
                  </div>
                ))}
                {parseErrors.length > 10 && (
                  <p className="text-sm text-orange-700 italic">
                    ... et {parseErrors.length - 10} autre(s) erreur(s)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bouton pour télécharger le CSV corrigé */}
          {correctedCSV && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Solution automatique disponible
              </h4>
              <p className="text-sm text-green-800 mb-3">
                Nous avons corrigé automatiquement les lignes valides. Téléchargez le fichier corrigé et réimportez-le.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (correctedCSV) {
                    const blob = new Blob([correctedCSV], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'donnees_corrigees.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                }}
                className="gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Télécharger le fichier corrigé
              </Button>
            </div>
          )}

          {/* Suggestion de re-télécharger le template */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              💡 <strong>Problème de format ?</strong>
            </p>
            <p className="text-sm text-blue-700 mb-3">
              Re-téléchargez le template et copiez-collez vos données directement dedans pour éviter les erreurs.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Re-télécharger le template
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium mb-2 text-blue-900">Format attendu :</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Colonnes requises : ad_name, cpl, spend, leads, date</li>
          <li>• Colonnes optionnelles : campaign_name, angle, ctr, roas</li>
          <li>• Minimum 7 jours de données</li>
          <li>• Format date : YYYY-MM-DD</li>
        </ul>
      </div>
    </div>
  )
}

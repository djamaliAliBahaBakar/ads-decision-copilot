'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { uploadAds } from '@/app/actions/ads'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { parseCSV } from '@/lib/csv-parser'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)
  const [mappedColumns, setMappedColumns] = useState<Record<string, string> | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    count: number
    duplicatesIgnored: number
    warnings: string[]
  } | null>(null)
  const router = useRouter()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setDetectedFormat(null)
    setMappedColumns(null)

    try {
      const text = await selectedFile.text()

      // Utiliser le parser intelligent avec support Meta
      const result = await parseCSV(text)

      if (result.errors.length > 0 && result.data.length === 0) {
        setError(`Erreur de parsing: ${result.errors[0].message}`)
        setPreview([])
        return
      }

      // Stocker le format détecté
      if (result.detectedFormat) {
        setDetectedFormat(result.detectedFormat)
      }
      if (result.mappedColumns) {
        setMappedColumns(result.mappedColumns)
      }

      // Preview 5 premières lignes des données parsées
      const previewData = result.data.slice(0, 5)
      setPreview(previewData)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du parsing')
      setPreview([])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setUploadResult(null)
    try {
      const text = await file.text()
      const result = await uploadAds(text)
      setUploadResult(result)
      setFile(null)
      setPreview([])
      setDetectedFormat(null)
      setMappedColumns(null)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Import CSV
        </h1>
        <p className="text-gray-600">Importez vos données Meta Ads pour analyse</p>
      </div>

      {/* Résultat de l'upload */}
      {uploadResult && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Import terminé</h3>
              <p className="text-sm text-green-700">
                {uploadResult.count} ligne(s) importée(s)
                {uploadResult.duplicatesIgnored > 0 && (
                  <span> • {uploadResult.duplicatesIgnored} doublon(s) ignoré(s)</span>
                )}
              </p>
            </div>
          </div>

          {uploadResult.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              {uploadResult.warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-amber-800">{warning}</p>
              ))}
            </div>
          )}

          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Voir le dashboard
          </Button>
        </Card>
      )}

      {/* Instructions Meta Ads Manager */}
      {!uploadResult && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="font-semibold text-blue-900 mb-2">📊 Comment exporter depuis Meta Ads Manager :</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Aller dans Meta Ads Manager → sélectionner votre compte</li>
            <li><strong>Important :</strong> Se positionner au niveau <strong>"Publicités"</strong> (pas Campagnes, pas Ensembles)</li>
            <li>Sélectionner la période souhaitée</li>
            <li>Cliquer sur "Exporter" → "Exporter les données du tableau"</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            💡 Astuce : Ajoutez la colonne "Nom de la campagne" pour un meilleur suivi
          </p>
        </Card>
      )}

      {!uploadResult && <Card className="p-6">
        <div className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${file && !error ? 'border-green-400 bg-green-50' : error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}
        `}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-input"
          />
          <label htmlFor="csv-input" className="cursor-pointer">
            {error ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-lg font-semibold text-red-900">
                  Erreur de format
                </div>
                <p className="text-sm text-red-700 max-w-md">
                  {error}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Cliquez pour sélectionner un autre fichier
                </p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-lg font-semibold text-green-900">
                  {file.name}
                </div>
                <p className="text-sm text-green-700">
                  {detectedFormat && detectedFormat !== 'adsdecision'
                    ? `Export ${detectedFormat === 'meta_report' ? 'Meta Ads Manager' : 'Meta'} détecté ✓`
                    : 'Fichier prêt à être importé'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  Glissez votre fichier CSV ici
                </div>
                <p className="text-sm text-gray-500">
                  ou cliquez pour sélectionner un fichier
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                  <p className="text-xs text-gray-600 font-medium mb-2">Formats supportés :</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Export Meta Ads Manager (français ou anglais)</li>
                    <li>• Format Ads Decision (ad_name, cpl, spend, leads, date)</li>
                  </ul>
                </div>
              </div>
            )}
          </label>
        </div>
      </Card>}

      {/* Reassurance text */}
      {!uploadResult && !file && (
        <div className="text-center text-sm text-gray-500">
          <p>Format Meta Ads Manager · Colonnes détectées automatiquement</p>
        </div>
      )}

      {/* Mapping détecté pour les exports Meta */}
      {mappedColumns && Object.keys(mappedColumns).length > 0 && detectedFormat !== 'adsdecision' && !error && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Colonnes mappées automatiquement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.entries(mappedColumns).map(([field, column]) => (
              <div key={field} className="flex items-center gap-2 bg-white p-2 rounded">
                <span className="text-blue-700 font-mono text-xs truncate max-w-24">{column}</span>
                <span className="text-blue-500">→</span>
                <span className="text-blue-900 font-medium">{field}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {preview.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Aperçu (5 premières lignes)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  {Object.keys(preview[0]).map(key => (
                    <th key={key} className="text-left p-3 font-semibold text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-blue-50/50 transition-colors">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="p-3 text-gray-700">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {file && (
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Import en cours...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importer les données
            </span>
          )}
        </Button>
      )}
    </div>
  )
}
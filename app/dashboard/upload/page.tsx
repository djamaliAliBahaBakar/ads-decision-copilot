'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { uploadAds } from '@/app/actions/ads'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // Parse pour preview
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      // Preview 5 lignes
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim())
        return headers.reduce((obj, header, idx) => ({
          ...obj,
          [header]: values[idx]
        }), {})
      })
      
      setPreview(previewData)
    }
    reader.readAsText(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      await uploadAds(text)
      setFile(null)
      setPreview([])
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Erreur lors de l\'upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Upload CSV
        </h1>
        <p className="text-gray-600">Importez vos données Meta Ads pour analyse</p>
      </div>

      <Card className="p-6">
        <div className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}
        `}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-input"
          />
          <label htmlFor="csv-input" className="cursor-pointer">
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-lg font-semibold text-green-900">
                  {file.name}
                </div>
                <p className="text-sm text-green-700">
                  Fichier prêt à être importé
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
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Format attendu:</p>
                  <p className="text-xs text-gray-500 font-mono">
                    ad_name, campaign_name, angle, cpl, spend, leads, date
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>
      </Card>

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
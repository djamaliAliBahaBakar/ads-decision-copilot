'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { parseCSV, AdRow } from '@/lib/csv-parser'
import { Upload, FileText, Download, CheckCircle2 } from 'lucide-react'

interface Step1Props {
  onComplete: (data: any) => void
}

export default function OnboardingStep1({ onComplete }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedRows, setUploadedRows] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    try {
      // Lire le fichier
      const text = await file.text()
      
      // Parser avec csv-parser.ts existant
      const rows = await parseCSV(text)

      // Validation : minimum 7 jours de données
      const uniqueDates = new Set(rows.map(r => r.date))
      if (uniqueDates.size < 7) {
        throw new Error('Le fichier doit contenir au moins 7 jours de données différentes')
      }

      // Envoyer au backend
      const response = await fetch('/api/onboarding/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement des données')
      }

      const result = await response.json()
      
      setUploadedRows(result.count)
      
      // Passer au step suivant après 1.5s
      setTimeout(() => {
        onComplete(result)
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Erreur lors du parsing du CSV')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `ad_name,campaign_name,angle,cpl,spend,leads,ctr,roas,date
Ad Test 1,Campagne Webinaire,PROBLEME,12.5,250,20,1.2,2.5,2026-01-15
Ad Test 2,Campagne Webinaire,MECANISME,8.3,166,20,1.5,3.0,2026-01-15
Ad Test 3,Campagne Lead Magnet,PREUVE,15.2,304,20,0.9,1.8,2026-01-16`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_ads_decision_copilot.csv'
    a.click()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Import de vos données Ads</h2>
      <p className="text-gray-600 mb-6">
        Importez vos données Meta Ads des 14 derniers jours minimum
      </p>

      {/* Bouton télécharger template */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Télécharger le template CSV
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

      {/* Succès */}
      {uploadedRows && (
        <div className="flex items-center justify-center gap-3 p-8 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <p className="text-green-800 font-medium">
            {uploadedRows} lignes importées avec succès
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
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

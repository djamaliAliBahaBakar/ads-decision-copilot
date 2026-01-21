'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { uploadAds } from '@/app/actions/ads'
import { useRouter } from 'next/navigation'

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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload tes données Meta Ads</h1>

      <Card className="p-6 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-input"
          />
          <label htmlFor="csv-input" className="cursor-pointer">
            <div className="text-lg font-semibold mb-2">
              {file ? file.name : 'Clique ou drag-drop ton CSV'}
            </div>
            <p className="text-sm text-gray-500">
              Format attendu : ad_name, campaign_name, angle, cpl, spend, leads, ctr, roas, date
            </p>
          </label>
        </div>
      </Card>

      {preview.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Aperçu (5 premières lignes)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {Object.keys(preview[0]).map(key => (
                    <th key={key} className="text-left p-2 font-semibold">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="p-2">
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
          className="w-full"
          size="lg"
        >
          {loading ? 'Import en cours...' : 'Importer'}
        </Button>
      )}
    </div>
  )
}
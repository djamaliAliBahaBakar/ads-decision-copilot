'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDigestSettings, toggleDigest } from '@/app/actions/digest'
import { Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function DigestSettings() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [lastDigest, setLastDigest] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const settings = await getDigestSettings()
      setIsEnabled(settings.isEnabled)
      setLastDigest(settings.lastDigest ?? null)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    setUpdating(true)
    try {
      await toggleDigest(!isEnabled)
      setIsEnabled(!isEnabled)
      toast.success(
        isEnabled
          ? 'Digests désactivés'
          : 'Digests activés - Tu recevras un email chaque lundi'
      )
    } catch (error) {
      toast.error('Erreur mise à jour')
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">📧 Email Digest Hebdomadaire</h3>
          </div>
          <p className="text-sm text-purple-800 mb-2">
            Reçois chaque lundi matin un résumé complet de ta semaine
          </p>
          {lastDigest && (
            <p className="text-xs text-purple-700">
              Dernier digest : {new Date(lastDigest).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        <Button
          onClick={handleToggle}
          disabled={updating}
          variant={isEnabled ? 'default' : 'outline'}
          className="ml-4"
        >
          {isEnabled ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Activé
            </>
          ) : (
            'Désactivé'
          )}
        </Button>
      </div>

      <div className="mt-4 p-3 bg-white rounded border border-purple-200 text-sm">
        <p className="text-purple-900">
          ✓ Discipline score (ta semaine)<br/>
          ✓ Top decisions (best + worst)<br/>
          ✓ Économies réalisées<br/>
          ✓ Tendance CPL<br/>
          ✓ 1 actionable insight
        </p>
      </div>
    </Card>
  )
}
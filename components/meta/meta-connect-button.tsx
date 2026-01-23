'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getMetaAuthUrl, getMetaAccountStatus, disconnectMetaAccount, syncMetaAds } from '@/app/actions/meta'
import { toast } from 'sonner'
import { Loader2, AlertCircle, CheckCircle2, Unlink } from 'lucide-react'

export function MetaConnectButton() {
  const [loading, setLoading] = useState(false)
  const [metaAccount, setMetaAccount] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const status = await getMetaAccountStatus()
      setMetaAccount(status)
    } catch (error) {
      console.error('Error fetching meta status:', error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const authUrl = await getMetaAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      toast.error('Erreur connexion Meta')
      console.error(error)
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncMetaAds()
      toast.success('Sync réussi ✓')
      await fetchStatus()
    } catch (error) {
      toast.error('Erreur sync Meta')
      console.error(error)
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Meta ?')) return

    try {
      await disconnectMetaAccount()
      setMetaAccount(null)
      toast.success('Déconnecté ✓')
    } catch (error) {
      toast.error('Erreur déconnexion')
      console.error(error)
    }
  }

  if (!metaAccount || !metaAccount.isActive) {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <h3 className="font-semibold mb-2">📱 Connecter Meta Ads</h3>
        <p className="text-sm text-gray-600 mb-4">
          Synchronise automatiquement tes ads depuis Meta. Plus besoin d'upload CSV.
        </p>
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            '🔗 Connecter Meta'
          )}
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-green-50 border-green-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Meta Connecté</h3>
          </div>
          <p className="text-sm text-green-800 mb-1">
            Compte: <strong>{metaAccount.accountName}</strong>
          </p>
          <p className="text-xs text-green-700 mb-1">
            Dernier sync: {metaAccount.lastSyncAt
              ? new Date(metaAccount.lastSyncAt).toLocaleString('fr-FR')
              : 'Jamais'}
          </p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Sync auto quotidien activé
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sync...
              </>
            ) : (
              '🔄 Sync maintenant'
            )}
          </Button>

          <Button
            onClick={handleDisconnect}
            variant="ghost"
            size="sm"
            className="w-full text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Unlink className="w-4 h-4 mr-2" />
            Déconnecter
          </Button>
        </div>
      </div>

      {metaAccount.syncStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          {metaAccount.syncError}
        </div>
      )}
    </Card>
  )
}
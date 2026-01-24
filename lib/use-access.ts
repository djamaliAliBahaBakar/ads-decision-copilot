'use client'

import { useEffect, useState } from 'react'
import type { AccessLevel } from '@prisma/client'

// Types matching server-side AccessInfo (without subscription details for client)
export interface ClientAccessInfo {
  level: AccessLevel
  isPaid: boolean
  isSuperuser: boolean
  canCreateDecision: boolean
  canViewDecisionDetails: boolean
  canExportData: boolean
  canCreateCustomRules: boolean
  canAccessFullJournal: boolean
  isEarlyAdopter: boolean
}

interface UseAccessReturn {
  access: ClientAccessInfo | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Client-side hook to get access permissions
 * Fetches from /api/access endpoint
 */
export function useAccess(): UseAccessReturn {
  const [access, setAccess] = useState<ClientAccessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccess = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/access')

      if (!response.ok) {
        if (response.status === 401) {
          setAccess(null)
          return
        }
        throw new Error('Failed to fetch access')
      }

      const data = await response.json()
      setAccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAccess(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccess()
  }, [])

  return {
    access,
    loading,
    error,
    refetch: fetchAccess,
  }
}

/**
 * Check if a feature is locked
 */
export function isFeatureLocked(
  access: ClientAccessInfo | null,
  feature: keyof Omit<ClientAccessInfo, 'level' | 'isPaid' | 'isSuperuser' | 'isEarlyAdopter'>
): boolean {
  if (!access) return true
  return !access[feature]
}

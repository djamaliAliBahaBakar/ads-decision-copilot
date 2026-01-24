'use client'

import { ReactNode, useState } from 'react'
import { Lock } from 'lucide-react'
import { PaywallModal } from './paywall-modal'
import { useAccess, isFeatureLocked } from '@/lib/use-access'
import type { ClientAccessInfo } from '@/lib/use-access'

type FeatureKey = keyof Omit<ClientAccessInfo, 'level' | 'isPaid' | 'isSuperuser' | 'isEarlyAdopter'>

interface LockedFeatureProps {
  children: ReactNode
  feature: FeatureKey
  fallback?: ReactNode
  showPaywall?: boolean
  lockMessage?: string
}

/**
 * Wrapper component that locks features based on access level
 *
 * Usage:
 * <LockedFeature feature="canCreateDecision">
 *   <CreateDecisionButton />
 * </LockedFeature>
 */
export function LockedFeature({
  children,
  feature,
  fallback,
  showPaywall = true,
  lockMessage = 'Fonctionnalité réservée aux membres.',
}: LockedFeatureProps) {
  const { access, loading } = useAccess()
  const [paywallOpen, setPaywallOpen] = useState(false)

  // While loading, show children (optimistic) or skeleton
  if (loading) {
    return <>{children}</>
  }

  // Check if feature is locked
  const locked = isFeatureLocked(access, feature)

  if (!locked) {
    return <>{children}</>
  }

  // Show fallback or locked state
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => showPaywall && setPaywallOpen(true)}
      >
        {/* Blurred/locked overlay */}
        <div className="relative">
          <div className="opacity-50 pointer-events-none select-none blur-[1px]">
            {children}
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 text-center max-w-[200px]">
                {lockMessage}
              </p>
              {showPaywall && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1">
                  Débloquer →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
        />
      )}
    </>
  )
}

/**
 * Simple locked button that opens paywall
 */
interface LockedButtonProps {
  children: ReactNode
  feature: FeatureKey
  className?: string
  lockMessage?: string
}

export function LockedButton({
  children,
  feature,
  className = '',
  lockMessage = 'Fonctionnalité réservée aux membres.',
}: LockedButtonProps) {
  const { access, loading } = useAccess()
  const [paywallOpen, setPaywallOpen] = useState(false)

  const locked = !loading && isFeatureLocked(access, feature)

  if (!locked) {
    return <>{children}</>
  }

  return (
    <>
      <button
        onClick={() => setPaywallOpen(true)}
        className={`relative flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity ${className}`}
      >
        <Lock className="w-4 h-4 text-gray-400" />
        <span className="text-gray-500">{lockMessage}</span>
      </button>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  )
}

/**
 * Tooltip for locked features
 */
interface LockedTooltipProps {
  children: ReactNode
  feature: FeatureKey
}

export function LockedTooltip({ children, feature }: LockedTooltipProps) {
  const { access, loading } = useAccess()
  const [paywallOpen, setPaywallOpen] = useState(false)

  const locked = !loading && isFeatureLocked(access, feature)

  if (!locked) {
    return <>{children}</>
  }

  return (
    <>
      <div className="relative group">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            Débloque cette fonctionnalité →
          </div>
        </div>

        {/* Click overlay */}
        <button
          onClick={() => setPaywallOpen(true)}
          className="absolute inset-0"
        />
      </div>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  )
}

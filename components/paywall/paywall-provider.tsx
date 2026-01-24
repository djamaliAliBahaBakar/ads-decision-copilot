'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { PaywallModal } from './paywall-modal'
import { toast } from 'sonner'

interface PaywallContextValue {
  openPaywall: () => void
  closePaywall: () => void
  isOpen: boolean
}

const PaywallContext = createContext<PaywallContextValue | null>(null)

interface PaywallProviderProps {
  children: ReactNode
}

export function PaywallProvider({ children }: PaywallProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openPaywall = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closePaywall = useCallback(() => {
    setIsOpen(false)
    // Show dismissal toast
    toast('Tu peux continuer à explorer. L\'accès complet sera là quand tu seras prêt.', {
      duration: 4000,
      position: 'bottom-center',
    })
  }, [])

  return (
    <PaywallContext.Provider value={{ openPaywall, closePaywall, isOpen }}>
      {children}
      <PaywallModal isOpen={isOpen} onClose={closePaywall} />
    </PaywallContext.Provider>
  )
}

export function usePaywall() {
  const context = useContext(PaywallContext)
  if (!context) {
    throw new Error('usePaywall must be used within a PaywallProvider')
  }
  return context
}

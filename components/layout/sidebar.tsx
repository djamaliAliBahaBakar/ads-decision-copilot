'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  BookOpen,
  Upload,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Navigation items - French (i18n-ready)
const navigation = [
  {
    name: 'Mes angles',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Performance par angle créatif',
  },
  {
    name: 'Décider',
    href: '/dashboard/decisions',
    icon: Target,
    description: 'Prendre des décisions sur mes ads',
    highlight: true, // Pour le mettre en avant
  },
  {
    name: 'Journal',
    href: '/dashboard/journal',
    icon: BookOpen,
    description: 'Historique des décisions',
  },
  {
    name: 'Import',
    href: '/dashboard/upload',
    icon: Upload,
    description: 'Importer des données',
  },
  {
    name: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configuration du compte',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ads Decision
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/50 z-40 mt-[57px]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:z-30
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ads Decision
                </h1>
                <p className="text-xs text-gray-500">Un cadre clair pour décider quoi faire de tes Ads</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              const Icon = item.icon
              const isHighlight = 'highlight' in item && item.highlight

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${
                      isActive
                        ? isHighlight
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold shadow-sm'
                          : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold shadow-sm'
                        : isHighlight
                          ? 'text-green-700 hover:bg-green-50 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? isHighlight ? 'text-green-600' : 'text-blue-600'
                        : isHighlight ? 'text-green-600' : 'text-gray-500'
                    }`}
                    strokeWidth={isActive || isHighlight ? 2.5 : 2}
                  />
                  <div className="flex-1">
                    <div className="text-sm">{item.name}</div>
                    {isActive && (
                      <div className={`text-xs mt-0.5 ${isHighlight ? 'text-green-600' : 'text-gray-600'}`}>
                        {item.description}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className={`w-1 h-6 rounded-full ${
                      isHighlight
                        ? 'bg-gradient-to-b from-green-500 to-emerald-500'
                        : 'bg-gradient-to-b from-blue-600 to-purple-600'
                    }`} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-900">Ads Decision</span>
              </div>
              <p className="text-xs text-gray-600">
                Un cadre clair pour décider quoi faire de tes Ads
              </p>
            </div>

            {/* Legal links */}
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
              <Link href="/cgv" className="hover:text-gray-700 hover:underline">
                CGV
              </Link>
              <span>·</span>
              <Link href="/mentions-legales" className="hover:text-gray-700 hover:underline">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

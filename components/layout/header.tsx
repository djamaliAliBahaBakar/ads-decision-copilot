'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { Bell, Search, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 mt-[57px] lg:mt-0">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Search bar (optional - can be implemented later) */}
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une campagne, une ad..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Notifications (optional) */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* User menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10',
                  },
                }}
              />

              {/* Bouton de déconnexion visible */}
              <SignOutButton redirectUrl="/sign-in">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { PaywallProvider } from '@/components/paywall'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PaywallProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </PaywallProvider>
  )
}

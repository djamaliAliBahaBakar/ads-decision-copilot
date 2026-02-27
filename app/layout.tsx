import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ads Decision - Un cadre clair pour décider quoi faire de tes Ads',
  description:
    'Prenez des décisions data-driven pour vos campagnes Meta Ads. Automatisez vos règles marketing et optimisez votre ROI.',
  keywords: ['Meta Ads', 'Facebook Ads', 'Marketing Automation', 'ROI', 'Decision Support'],
  other: {
    'facebook-domain-verification': 'ipfsfra5npowvshlzy5nuvns0i3hh9',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <html lang="fr">
      <body>
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}

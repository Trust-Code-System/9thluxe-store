import './globals.css'

import type { Metadata } from 'next'
import { Poppins, Playfair_Display } from 'next/font/google'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import ThemeProvider from '@/components/ThemeProvider'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { WhatsAppWidget } from '@/components/WhatsAppWidget'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Fàdè | Luxury Watches, Perfumes & Eyeglasses',
  description:
    'Modern luxury for every day. Discover curated watches, perfumes, and eyeglasses with delivery across Nigeria.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background text-foreground antialiased', poppins.variable, playfair.variable)} suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
          <WhatsAppWidget />
        </ThemeProvider>
      </body>
    </html>
  )
}

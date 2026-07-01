import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import { UiPrefsSync } from '@/components/providers/UiPrefsSync'
import { ConfirmProvider } from '@/components/lecode/ConfirmDialog'
import { ToastProvider } from '@/components/lecode/Toast'
import './globals.css'

const display = Space_Grotesk({ variable: '--font-display', subsets: ['latin'], weight: ['400', '600'], display: 'swap' })
const mono    = IBM_Plex_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '600'], display: 'swap' })

export const metadata: Metadata = {
  title:       'LeCode Performance Review',
  description: 'Plataforma de avaliação de desempenho LeCode',
  icons: { icon: '/icon.png', shortcut: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      data-density="regular"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <UiPrefsSync />
        <ConfirmProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConfirmProvider>
      </body>
    </html>
  )
}

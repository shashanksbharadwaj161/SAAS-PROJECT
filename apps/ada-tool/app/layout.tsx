import type { Metadata, Viewport } from 'next'
import './design-tokens.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'ADA Compliance Assessment Tool',
  description:
    'Technical evidence package for websites — not legal advice. WCAG 2.2 AA analysis for ADA demand letter response.',
}

export const viewport: Viewport = {
  themeColor: '#060912',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {children}
      </body>
    </html>
  )
}

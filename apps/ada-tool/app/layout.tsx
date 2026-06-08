import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ADA Compliance Assessment Tool',
  description:
    'Technical evidence package for websites — not legal advice. WCAG 2.1 AA analysis for ADA demand letter response.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

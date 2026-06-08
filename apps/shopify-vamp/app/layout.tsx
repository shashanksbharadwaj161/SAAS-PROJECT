import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VAMP Monitor for Shopify',
  description:
    'Track your Visa dispute ratio and stay below the 1.5% VAMP threshold. Real-time alerts and end-of-month projections.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

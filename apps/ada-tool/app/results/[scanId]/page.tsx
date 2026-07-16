import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@saas/db'
import ResultsView, { type ResultViolation, type PdfDownload } from './ResultsView'

// Results are private, per-scan, and read fresh from the DB on every request
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Scan Results — WCAG Technical Evidence',
  robots: { index: false, follow: false },
}

// Shape of violations as stored in scans.raw_results
interface RawViolation {
  id: string
  description: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  nodes: number
  wcagCriteria: string[]
}

interface RawScanResults {
  violations?: RawViolation[]
  incomplete?: unknown[]
  passes?: number
}

const PDF_LABELS: Record<string, string> = {
  'evidence-package':        'Evidence Package',
  'developer-guide':         'Developer Remediation Guide',
  'monitoring-confirmation': 'Monitoring Confirmation',
}

function withScanId(gumroadUrl: string, scanId: string): string {
  const sep = gumroadUrl.includes('?') ? '&' : '?'
  return `${gumroadUrl}${sep}scan_id=${encodeURIComponent(scanId)}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ scanId: string }>
}

export default async function ResultsPage({ params }: Props) {
  const { scanId } = await params
  if (!UUID_RE.test(scanId)) notFound()

  const db = createServiceClient()

  const { data: scan } = await db
    .from('scans')
    .select('url, business_name, score, raw_results, created_at')
    .eq('id', scanId)
    .maybeSingle()

  if (!scan) notFound()

  // Latest purchase linked to this scan, if any
  const { data: payment } = await db
    .from('payments')
    .select('id, tier, pdf_urls')
    .eq('scan_id', scanId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const raw = scan.raw_results as RawScanResults
  const violations: ResultViolation[] = (raw.violations ?? []).map(v => ({
    id:             v.id,
    description:    v.description,
    impact:         v.impact,
    nodes_affected: v.nodes,
    wcag_criteria:  v.wcagCriteria ?? [],
  }))

  // Download links are re-signed on every page load so they never expire —
  // the URLs stored in payments.pdf_urls are only a fallback if signing fails.
  let purchase: { tier: string; downloads: PdfDownload[] } | null = null
  if (payment) {
    const keys = Object.entries(payment.pdf_urls ?? {})
      .filter(([, url]) => typeof url === 'string' && url.length > 0)

    const downloads = await Promise.all(
      keys.map(async ([key, storedUrl]) => {
        const { data: signed } = await db.storage
          .from('ada-pdfs')
          .createSignedUrl(`payments/${payment.id}/${key}.pdf`, 60 * 60) // 1 hour
        return { label: PDF_LABELS[key] ?? key, url: signed?.signedUrl ?? storedUrl }
      }),
    )
    purchase = { tier: payment.tier, downloads }
  }

  const gumroadUrls = {
    basic:      process.env.GUMROAD_PRODUCT_BASIC      ?? '#',
    premium:    process.env.GUMROAD_PRODUCT_PREMIUM    ?? '#',
    monitoring: process.env.GUMROAD_PRODUCT_MONITORING ?? '#',
  }

  return (
    <ResultsView
      url={scan.url}
      businessName={scan.business_name}
      score={scan.score}
      scanDateLabel={new Date(scan.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })}
      violations={violations}
      passCount={raw.passes ?? 0}
      incompleteCount={(raw.incomplete ?? []).length}
      purchase={purchase}
      checkout={{
        basic:      withScanId(gumroadUrls.basic, scanId),
        premium:    withScanId(gumroadUrls.premium, scanId),
        monitoring: withScanId(gumroadUrls.monitoring, scanId),
      }}
    />
  )
}

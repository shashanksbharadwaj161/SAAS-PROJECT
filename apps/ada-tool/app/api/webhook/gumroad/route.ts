// Gumroad ping webhook — payment → PDF generation → email delivery.
//
// HARD RULE: every response from this route is HTTP 200. A non-200 causes
// Gumroad to retry the ping, and retries risk duplicate processing. Failures
// are logged server-side and recoverable via the payments table instead.
// Idempotency is guaranteed by the UNIQUE constraint on payments.sale_id plus
// the explicit duplicate check below.

import { createServiceClient } from '@saas/db'
import {
  generatePdfsForTier,
  type EvidenceData,
  type MonitoringData,
  type ViolationSummary,
} from '../../../../lib/pdf'
import { sendPdfDelivery } from '../../../../lib/email'

export const runtime = 'nodejs'

type Tier = 'basic' | 'premium' | 'monitoring'

// Gumroad sends prices in cents.
const PRICE_TO_TIER: Record<number, Tier> = {
  4900:  'basic',       // $49 — evidence package
  7900:  'premium',     // $79 — evidence package + developer guide
  14900: 'monitoring',  // $149/mo — all 3 docs + ongoing monitoring
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Pragmatic email shape check — Gumroad has already validated the address.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

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

function rawToEvidenceViolations(raw: Record<string, unknown>): ViolationSummary[] {
  const results = raw as RawScanResults
  return (results.violations ?? []).map((v) => ({
    id:            v.id,
    description:   v.description,
    impact:        v.impact,
    nodes_affected: v.nodes,
    wcag_criteria: v.wcagCriteria,
  }))
}

/**
 * Extracts the scan_id that ScanWidget appended to the Gumroad checkout URL.
 *
 * Gumroad echoes checkout URL params back in the ping, but the encoding varies:
 *  1. Rails-style nested form keys:  url_params[scan_id]=<uuid>   (most common)
 *  2. A JSON object string:          url_params={"scan_id":"<uuid>"}
 *  3. A top-level field:             scan_id=<uuid>               (custom fields)
 * All three are handled; the result is only accepted if it is a valid UUID.
 */
function extractScanId(body: FormData): string | null {
  const candidates: Array<string | null> = []

  const bracket = body.get('url_params[scan_id]')
  if (typeof bracket === 'string') candidates.push(bracket)

  const urlParamsRaw = body.get('url_params')
  if (typeof urlParamsRaw === 'string') {
    try {
      const parsed = JSON.parse(urlParamsRaw) as Record<string, unknown>
      if (parsed && typeof parsed === 'object' && typeof parsed.scan_id === 'string') {
        candidates.push(parsed.scan_id)
      }
    } catch {
      // Not JSON — fall through to other encodings
    }
  }

  const topLevel = body.get('scan_id')
  if (typeof topLevel === 'string') candidates.push(topLevel)

  for (const c of candidates) {
    if (c && UUID_RE.test(c.trim())) return c.trim().toLowerCase()
  }
  return null
}

/**
 * Fallback tier detection by product permalink, for purchases where the price
 * doesn't match the canonical cents values (discount codes, price changes).
 * Permalinks are derived from the GUMROAD_PRODUCT_* env URLs (".../l/<permalink>").
 */
function tierFromPermalink(permalink: string | null): Tier | null {
  if (!permalink) return null
  const envMap: Array<[string | undefined, Tier]> = [
    [process.env.GUMROAD_PRODUCT_BASIC,      'basic'],
    [process.env.GUMROAD_PRODUCT_PREMIUM,    'premium'],
    [process.env.GUMROAD_PRODUCT_MONITORING, 'monitoring'],
  ]
  for (const [url, tier] of envMap) {
    const slug = url?.split('/l/')[1]?.split(/[/?#]/)[0]
    if (slug && slug === permalink) return tier
  }
  return null
}

// Every exit from this route is HTTP 200 — see rule at top of file.
function ok(bodyJson: Record<string, unknown>): Response {
  return Response.json(bodyJson, { status: 200 })
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (
    !contentType.includes('application/x-www-form-urlencoded') &&
    !contentType.includes('multipart/form-data')
  ) {
    return ok({ received: true, skipped: true, reason: 'invalid_content_type' })
  }

  let body: FormData
  try {
    body = await request.formData()
  } catch {
    return ok({ received: true, skipped: true, reason: 'unparseable_body' })
  }

  const sellerId    = body.get('seller_id')    as string | null
  const email       = (body.get('email')       as string | null)?.trim().slice(0, 320) ?? null
  const price       = body.get('price')        as string | null
  const saleId      = (body.get('sale_id')     as string | null)?.trim().slice(0, 128) ?? null
  const orderNumber = body.get('order_number') as string | null
  const isTest      = body.get('test')         as string | null
  const permalink   = (body.get('permalink') ?? body.get('product_permalink')) as string | null

  const scanId = extractScanId(body)

  // ── Verify seller identity ────────────────────────────────────────────────
  const expectedSellerId = process.env.GUMROAD_SELLER_ID
  if (!expectedSellerId) {
    console.error('CRITICAL: GUMROAD_SELLER_ID env var is not set — webhook cannot verify sender')
    return ok({ received: true, skipped: true, reason: 'server_misconfigured' })
  }
  if (sellerId !== expectedSellerId) {
    return ok({ received: true, skipped: true, reason: 'unrecognised_seller' })
  }

  // ── Skip Gumroad test purchases ───────────────────────────────────────────
  if (isTest === 'true') {
    return ok({ received: true, skipped: true, reason: 'test_purchase' })
  }

  // ── Validate required fields ──────────────────────────────────────────────
  if (!email || !EMAIL_RE.test(email) || !saleId || !price) {
    console.warn(`Webhook missing/invalid required fields (order ${orderNumber ?? 'unknown'})`)
    return ok({ received: true, skipped: true, reason: 'missing_required_fields' })
  }

  // ── Map price to tier (permalink as fallback for discounted prices) ──────
  const priceInCents = parseInt(price, 10)
  const tier = PRICE_TO_TIER[priceInCents] ?? tierFromPermalink(permalink)
  if (!tier) {
    console.warn(`Unknown Gumroad price ${priceInCents}c, permalink ${permalink} (order ${orderNumber})`)
    return ok({ received: true, skipped: true, reason: 'unrecognised_price' })
  }

  const db = createServiceClient()

  // ── Idempotency: skip if this sale was already processed ─────────────────
  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('sale_id', saleId)
    .maybeSingle()

  if (existing) {
    return ok({ received: true, skipped: true, reason: 'duplicate_sale', payment_id: existing.id })
  }

  // ── Record the payment (one retry — losing a paid sale is the worst case) ─
  const insertPayment = () =>
    db
      .from('payments')
      .insert({ scan_id: scanId, sale_id: saleId, tier, email, pdf_urls: {} })
      .select('id')
      .single()

  let { data: payment, error: paymentError } = await insertPayment()
  if (paymentError) {
    await new Promise((r) => setTimeout(r, 500))
    ;({ data: payment, error: paymentError } = await insertPayment())
  }

  if (paymentError || !payment) {
    // 23505 = unique_violation — a concurrent retry already recorded this sale.
    if (paymentError?.code === '23505') {
      return ok({ received: true, skipped: true, reason: 'duplicate_sale' })
    }
    console.error(`CRITICAL: payments insert failed for sale ${saleId}:`, paymentError?.message)
    return ok({ received: true, error: 'payment_record_failed' })
  }

  const { error: deliveryError } = await db
    .from('email_deliveries')
    .insert({ payment_id: payment.id, email, status: 'pending' })

  if (deliveryError) {
    // Non-fatal: payment recorded; delivery tracked via logs
    console.error('email_deliveries insert error:', deliveryError.message)
  }

  // ── PDF generation + email delivery ──────────────────────────────────────
  try {
    // Look up the exact scan the buyer ran before purchasing. There is
    // deliberately NO "most recent scan" fallback: guessing risks putting one
    // customer's scan data into another customer's legal evidence document.
    let scannedUrl      = 'No scan linked to this purchase'
    let scanScore       = 0
    let violations:     ViolationSummary[] = []
    let passCount       = 0
    let incompleteCount = 0
    let businessName:   string | null = null
    let scanLinked      = false

    if (scanId) {
      const { data: scan, error: scanError } = await db
        .from('scans')
        .select('url, score, raw_results, business_name')
        .eq('id', scanId)
        .maybeSingle()

      if (scanError) {
        console.warn(`Scan lookup failed for ${scanId}: ${scanError.message}`)
      } else if (scan) {
        scannedUrl      = scan.url
        scanScore       = scan.score
        businessName    = scan.business_name
        violations      = rawToEvidenceViolations(scan.raw_results)
        passCount       = (scan.raw_results as RawScanResults).passes ?? 0
        incompleteCount = ((scan.raw_results as RawScanResults).incomplete ?? []).length
        scanLinked      = true
      }
    }

    const evidenceData: EvidenceData = {
      url:            scannedUrl,
      businessName,
      scanDate:       new Date(),
      score:          scanScore,
      tier,
      violations,
      passCount,
      incompleteCount,
      noScanData:     !scanLinked,
    }

    const monitoringData: MonitoringData | undefined =
      tier === 'monitoring'
        ? { url: scannedUrl, activationDate: new Date(), email }
        : undefined

    const signedUrls = await generatePdfsForTier(tier, payment.id, evidenceData, monitoringData)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    await sendPdfDelivery({
      paymentId:  payment.id,
      email,
      tier,
      pdfUrls:    signedUrls,
      scanScore,
      hasScan:    scanLinked,
      resultsUrl: scanLinked && appUrl ? `${appUrl}/results/${scanId}` : null,
    })
  } catch (err) {
    // Pipeline failure is non-fatal to Gumroad — payment is recorded and the
    // PDFs can be regenerated from the payments row.
    console.error(`PDF/email pipeline failed for payment ${payment.id}:`, err)
  }

  return ok({ received: true, payment_id: payment.id })
}

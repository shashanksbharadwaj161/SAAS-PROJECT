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

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return Response.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const body = await request.formData()

  const sellerId    = body.get('seller_id')    as string | null
  const email       = body.get('email')        as string | null
  const price       = body.get('price')        as string | null
  const saleId      = body.get('sale_id')      as string | null
  const orderNumber = body.get('order_number') as string | null
  const isTest      = body.get('test')         as string | null
  // stored for debugging / future use
  const _productId   = body.get('product_id')   as string | null
  const _productName = body.get('product_name') as string | null

  // ── Extract scan_id from Gumroad URL parameters ────────────────────────────
  // Gumroad passes checkout URL params back as a JSON string in url_params.
  // The scan_id is appended to each checkout link by ScanWidget after a scan.
  let scanId: string | null = null
  const urlParamsRaw = body.get('url_params') as string | null
  if (urlParamsRaw) {
    try {
      const urlParams = JSON.parse(urlParamsRaw) as Record<string, string>
      scanId = urlParams['scan_id'] ?? null
    } catch {
      // url_params not valid JSON — no scan_id available
    }
  }

  // ── Verify seller identity ────────────────────────────────────────────────
  const expectedSellerId = process.env.GUMROAD_SELLER_ID
  if (!expectedSellerId) {
    console.error('GUMROAD_SELLER_ID env var is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (sellerId !== expectedSellerId) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // ── Skip Gumroad test purchases ───────────────────────────────────────────
  // TEMP: allow test purchases for pipeline verification
  // if (isTest === 'true') {
  //   return Response.json({ received: true, skipped: true, reason: 'test_purchase' })
  // }

  // ── Validate required fields ──────────────────────────────────────────────
  if (!email || !saleId || !price) {
    return Response.json({ error: 'Missing required fields: email, sale_id, price' }, { status: 400 })
  }

  // ── Map price to tier ─────────────────────────────────────────────────────
  const priceInCents = parseInt(price, 10)
  const tier = PRICE_TO_TIER[priceInCents]
  if (!tier) {
    // Log unknown price but return 200 so Gumroad doesn't retry indefinitely
    console.warn(`Unknown Gumroad price: ${priceInCents} cents (order ${orderNumber})`)
    return Response.json({ received: true, skipped: true, reason: 'unrecognised_price' })
  }

  // ── Write to Supabase ─────────────────────────────────────────────────────
  const db = createServiceClient()

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .insert({
      scan_id: scanId,
      sale_id: saleId,
      tier,
      email,
      pdf_urls: {},    // populated below by generatePdfsForTier
    })
    .select('id')
    .single()

  if (paymentError) {
    console.error('payments insert error:', paymentError)
    // Return 500 so Gumroad retries the webhook on DB failure
    return Response.json({ error: 'Database error' }, { status: 500 })
  }

  const { error: deliveryError } = await db
    .from('email_deliveries')
    .insert({
      payment_id: payment.id,
      email,
      status: 'pending',
    })

  if (deliveryError) {
    // Non-fatal: payment recorded, email delivery tracked via logs
    console.error('email_deliveries insert error:', deliveryError)
  }

  // ── PDF generation + email delivery ──────────────────────────────────────
  // Wrapped in try/catch — MUST always return 200 to Gumroad.
  // A non-200 causes Gumroad to retry, creating duplicate payment records.
  try {
    // Look up the scan the buyer ran before purchasing, if available.
    // scanId is appended to the Gumroad checkout URL by ScanWidget and
    // echoed back in the webhook payload under url_params.
    let scannedUrl    = 'URL not available'
    let scanScore     = 0
    let violations:   ViolationSummary[] = []
    let passCount     = 0
    let incompleteCount = 0

    if (scanId) {
      const { data: scan, error: scanError } = await db
        .from('scans')
        .select('url, score, raw_results')
        .eq('id', scanId)
        .single()

      if (scanError) {
        console.warn(`Could not fetch scan ${scanId}: ${scanError.message}`)
      } else if (scan) {
        scannedUrl      = scan.url
        scanScore       = scan.score
        violations      = rawToEvidenceViolations(scan.raw_results)
        passCount       = (scan.raw_results as RawScanResults).passes ?? 0
        incompleteCount = ((scan.raw_results as RawScanResults).incomplete ?? []).length
      }
    }

    const evidenceData: EvidenceData = {
      url:            scannedUrl,
      scanDate:       new Date(),
      score:          scanScore,
      tier,
      violations,
      passCount,
      incompleteCount,
    }

    const monitoringData: MonitoringData | undefined =
      tier === 'monitoring'
        ? { url: scannedUrl, activationDate: new Date(), email }
        : undefined

    const signedUrls = await generatePdfsForTier(
      tier,
      payment.id,
      evidenceData,
      monitoringData,
    )

    await sendPdfDelivery({
      paymentId: payment.id,
      email,
      tier,
      pdfUrls:   signedUrls,
      scanScore,
    })

  } catch (err) {
    // Pipeline failure is non-fatal to Gumroad. Payment is recorded.
    // Manual retry possible via /api/generate-pdf (to be added in S9).
    console.error(`PDF/email pipeline failed for payment ${payment.id}:`, err)
  }

  return Response.json({ received: true, payment_id: payment.id })
}

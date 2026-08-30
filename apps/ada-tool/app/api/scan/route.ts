// axe-core catches ~57% of WCAG issues automatically (Deque Systems, 2,000+ audits, 300K issues).
// Every response from this route MUST include coverageNote to disclose that limit.

import { createHash } from 'crypto'
import { createServiceClient } from '@saas/db'
import { scanUrl, ScanError } from '@/lib/scan'
import { calculateScore, toViolationSummary } from '@/lib/score'
import { assertPublicUrl, BlockedUrlError } from '@/lib/ssrf'

export const maxDuration = 60
export const runtime = 'nodejs'

const COVERAGE_NOTE =
  'Automated scanning detects approximately 57% of WCAG issues. A complete accessibility audit requires manual review.'

const MAX_URL_LENGTH = 2048

/**
 * Client IP for rate limiting. Uses the LAST x-forwarded-for entry: proxies
 * append the address of the peer they accepted the connection from, so the
 * rightmost entry was written by our own proxy (Render) and cannot be spoofed
 * by the client — unlike the first entry, which the client controls.
 */
function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const entries = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (entries.length > 0) return entries[entries.length - 1]!
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: Request) {
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be JSON' }, { status: 400 })
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('url' in body) ||
    typeof (body as Record<string, unknown>).url !== 'string'
  ) {
    return Response.json({ error: 'Missing required field: url (string)' }, { status: 400 })
  }

  const rawUrl = ((body as { url: string }).url).trim()
  if (rawUrl.length === 0 || rawUrl.length > MAX_URL_LENGTH) {
    return Response.json({ error: 'URL must be between 1 and 2048 characters' }, { status: 400 })
  }

  // Optional business name — shown on the PDF header for legal reference
  const rawBusinessName = (body as Record<string, unknown>).businessName
  const businessName =
    typeof rawBusinessName === 'string' && rawBusinessName.trim().length > 0
      ? rawBusinessName.trim().slice(0, 200)
      : null

  // ── 2. Validate URL (syntax + SSRF: DNS-resolved public-address check) ────
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    return Response.json({ error: 'Invalid URL format' }, { status: 400 })
  }
  try {
    await assertPublicUrl(parsedUrl)
  } catch (err) {
    if (err instanceof BlockedUrlError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    console.error('URL validation error:', err)
    return Response.json({ error: 'Could not validate URL' }, { status: 400 })
  }

  // ── 3. Rate limit: 1 scan per IP per 60 seconds ───────────────────────────
  const ipHash = createHash('sha256').update(getClientIp(request)).digest('hex')
  // Fail before launching Chromium when the persistence layer is unavailable.
  // This keeps a deployment misconfiguration from looking like a network error
  // to a visitor and avoids spending free-instance CPU on an unsaveable scan.
  let db: ReturnType<typeof createServiceClient>
  try {
    db = createServiceClient()
  } catch (err) {
    console.error('Supabase configuration error:', err)
    return Response.json(
      { error: 'The scanning service is being configured. Please try again shortly.' },
      { status: 503 },
    )
  }

  const { data: recentScan } = await db
    .from('scans')
    .select('id')
    .eq('ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1)
    .maybeSingle()

  if (recentScan) {
    return Response.json(
      { error: 'Rate limit exceeded. Please wait 60 seconds between scans.' },
      { status: 429 },
    )
  }

  // ── 4. Run WCAG scan ──────────────────────────────────────────────────────
  let scanResult
  try {
    scanResult = await scanUrl(parsedUrl.toString())
  } catch (err) {
    if (err instanceof ScanError) {
      const statusMap = { UNREACHABLE: 422, TIMEOUT: 504, SCAN_FAILED: 500 } as const
      return Response.json({ error: err.message }, { status: statusMap[err.code] })
    }
    console.error('Unexpected scan error:', err)
    return Response.json({ error: 'Scan failed unexpectedly' }, { status: 500 })
  }

  // ── 5. Compute score ──────────────────────────────────────────────────────
  const score = calculateScore(scanResult.violations)

  // ── 6. Persist to DB ──────────────────────────────────────────────────────
  const { data: saved, error: insertError } = await db
    .from('scans')
    .insert({
      url: parsedUrl.toString(),
      business_name: businessName,
      raw_results: scanResult as unknown as Record<string, unknown>,
      score,
      ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (insertError || !saved) {
    console.error('scans insert error:', insertError)
    return Response.json({ error: 'Failed to save scan results' }, { status: 500 })
  }

  // ── 7. Return safe subset — never expose raw_results ─────────────────────
  // severityCounts covers ALL violations (counts only — details stay paywalled)
  const severityCounts = {
    critical: scanResult.violations.filter(v => v.impact === 'critical').length,
    serious:  scanResult.violations.filter(v => v.impact === 'serious').length,
    moderate: scanResult.violations.filter(v => v.impact === 'moderate').length,
    minor:    scanResult.violations.filter(
      v => v.impact !== 'critical' && v.impact !== 'serious' && v.impact !== 'moderate',
    ).length,
  }

  return Response.json({
    scanId: saved.id,
    score,
    violations: scanResult.violations.slice(0, 3).map(toViolationSummary),
    totalViolations: scanResult.violations.length,
    severityCounts,
    incompleteCount: scanResult.incomplete.length,
    passCount: scanResult.passes,
    coverageNote: COVERAGE_NOTE,
  })
}

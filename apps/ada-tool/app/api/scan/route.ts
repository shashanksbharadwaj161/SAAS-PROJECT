// axe-core catches ~57% of WCAG issues automatically (Deque Systems, 2,000+ audits, 300K issues).
// Every response from this route MUST include coverageNote to disclose that limit.

import { createHash } from 'crypto'
import { createServiceClient } from '@saas/db'
import { scanUrl, ScanError } from '@/lib/scan'
import { calculateScore, toViolationSummary } from '@/lib/score'

export const maxDuration = 60
export const runtime = 'nodejs'

const COVERAGE_NOTE =
  'Automated scanning detects approximately 57% of WCAG issues. A complete accessibility audit requires manual review.'

function validateUrl(raw: string): URL {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Invalid URL format')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use http or https')
  }
  const blockedHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0']
  if (
    blockedHosts.includes(parsed.hostname) ||
    parsed.hostname.endsWith('.local') ||
    // Block RFC-1918 ranges in string form (best-effort; not a security boundary)
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname)
  ) {
    throw new Error('Scanning local or internal addresses is not allowed')
  }
  return parsed
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
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

  // ── 2. Validate URL ───────────────────────────────────────────────────────
  let parsedUrl: URL
  try {
    parsedUrl = validateUrl(rawUrl)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 })
  }

  // ── 3. Rate limit: 1 scan per IP per 60 seconds ───────────────────────────
  const ipHash = createHash('sha256').update(getClientIp(request)).digest('hex')
  const db = createServiceClient()

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
  return Response.json({
    scanId: saved.id,
    score,
    violations: scanResult.violations.slice(0, 3).map(toViolationSummary),
    incompleteCount: scanResult.incomplete.length,
    passCount: scanResult.passes,
    coverageNote: COVERAGE_NOTE,
  })
}

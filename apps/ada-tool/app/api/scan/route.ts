// S3: WCAG scan endpoint
// POST { url: string } → { scanId, score, violations, incomplete, coverageNote }
//
// Requires Vercel Pro: 60s timeout + 1024MB memory (configured in vercel.json)
// Uses: puppeteer-core + @sparticuz/chromium-min (NOT full puppeteer — exceeds 50MB bundle)
//
// DISCLOSURE REQUIREMENT: every response must include coverageNote stating
// axe-core detects ~57% of WCAG issues automatically. Never imply full coverage.

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(_request: Request) {
  // TODO S3:
  // 1. Parse + validate { url } from request body
  // 2. Hash requester IP for rate limiting (store as ip_hash, never raw IP)
  // 3. Call lib/scan.ts → run axe-core via puppeteer-core + @sparticuz/chromium-min
  // 4. Call lib/score.ts → compute weighted score (critical×10, serious×5, moderate×3, minor×1)
  // 5. INSERT into scans table via @saas/db service client
  // 6. Return { scanId, score, violations (top 3 for free), incomplete, coverageNote }
  return Response.json({ error: 'Not implemented — build in S3' }, { status: 501 })
}

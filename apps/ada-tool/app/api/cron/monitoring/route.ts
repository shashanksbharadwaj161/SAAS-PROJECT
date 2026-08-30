import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@saas/db'
import { scanUrl } from '@/lib/scan'
import { calculateScore } from '@/lib/score'
import { sendMonitoringAlert } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_SCANS_PER_RUN = 5

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!secret || !supplied || secret.length !== supplied.length) return false
  return timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))
}

function nextMonthlyRun(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)).toISOString()
}

/** Runs due monitoring scans. Invoke only from the protected Render cron job. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const now = new Date()
  const { data: subscriptions, error } = await db
    .from('monitoring_subscriptions')
    .select('id, scan_id, email, latest_score')
    .eq('status', 'active')
    .lte('next_scan_at', now.toISOString())
    .order('next_scan_at', { ascending: true })
    .limit(MAX_SCANS_PER_RUN)

  if (error) {
    console.error('monitoring subscription lookup failed:', error.message)
    return Response.json({ error: 'Failed to load subscriptions' }, { status: 500 })
  }

  const outcomes: Array<{ id: string; status: 'scanned' | 'skipped' | 'failed' }> = []
  for (const subscription of subscriptions ?? []) {
    if (!subscription.scan_id) {
      await db.from('monitoring_subscriptions').update({ status: 'failed', updated_at: now.toISOString() }).eq('id', subscription.id)
      outcomes.push({ id: subscription.id, status: 'skipped' })
      continue
    }

    const { data: priorScan } = await db.from('scans').select('url, business_name').eq('id', subscription.scan_id).maybeSingle()
    if (!priorScan) {
      await db.from('monitoring_subscriptions').update({ status: 'failed', updated_at: now.toISOString() }).eq('id', subscription.id)
      outcomes.push({ id: subscription.id, status: 'skipped' })
      continue
    }

    try {
      const result = await scanUrl(priorScan.url)
      const score = calculateScore(result.violations)
      const { data: saved, error: saveError } = await db.from('scans').insert({
        url: priorScan.url,
        business_name: priorScan.business_name,
        raw_results: result as unknown as Record<string, unknown>,
        score,
        ip_hash: null,
      }).select('id').single()
      if (saveError || !saved) throw new Error(saveError?.message ?? 'Could not save monitoring scan')

      await db.from('monitoring_subscriptions').update({
        scan_id: saved.id,
        latest_score: score,
        last_scanned_at: now.toISOString(),
        next_scan_at: nextMonthlyRun(now),
        updated_at: now.toISOString(),
      }).eq('id', subscription.id)

      if (score < 70) await sendMonitoringAlert({ email: subscription.email, url: priorScan.url, score, scanId: saved.id })
      outcomes.push({ id: subscription.id, status: 'scanned' })
    } catch (err) {
      console.error(`monitoring scan failed for ${subscription.id}:`, err)
      outcomes.push({ id: subscription.id, status: 'failed' })
    }
  }

  return Response.json({ processed: outcomes.length, outcomes })
}

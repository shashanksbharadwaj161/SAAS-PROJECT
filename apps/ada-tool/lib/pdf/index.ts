import {
  generateEvidencePackage,
  generateDevGuide,
  generateMonitoringConfirmation,
  type EvidenceData,
  type MonitoringData,
  type ViolationSummary,
} from '@saas/pdf'
import { createServiceClient } from '@saas/db'
import { enhanceViolations } from '../enhance'

export type { EvidenceData, MonitoringData, ViolationSummary }

// ─── Constants ────────────────────────────────────────────────────────────────

const BUCKET          = 'ada-pdfs'
const SIGNED_URL_TTL  = 60 * 60 * 24 * 7   // 7 days in seconds

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TierPdf {
  filename: string
  bytes: Uint8Array
}

// ─── Tier routing ─────────────────────────────────────────────────────────────

// Returns the set of PDFs to generate for the given tier.
// basic      → [evidence-package.pdf]
// premium    → [evidence-package.pdf, developer-guide.pdf]
// monitoring → [evidence-package.pdf, developer-guide.pdf, monitoring-confirmation.pdf]
export async function buildPdfsForTier(
  tier: 'basic' | 'premium' | 'monitoring',
  evidenceData: EvidenceData,
  monitoringData?: MonitoringData,
): Promise<TierPdf[]> {
  const pdfs: TierPdf[] = []

  // All tiers: evidence package (cover + disclaimer + summary + violations)
  pdfs.push({
    filename: 'evidence-package.pdf',
    bytes: await generateEvidencePackage(evidenceData),
  })

  // Premium and monitoring: developer remediation guide
  if (tier === 'premium' || tier === 'monitoring') {
    pdfs.push({
      filename: 'developer-guide.pdf',
      bytes: await generateDevGuide(evidenceData),
    })
  }

  // Monitoring only: activation confirmation
  if (tier === 'monitoring' && monitoringData) {
    pdfs.push({
      filename: 'monitoring-confirmation.pdf',
      bytes: await generateMonitoringConfirmation(monitoringData),
    })
  }

  return pdfs
}

// ─── Storage upload ───────────────────────────────────────────────────────────

// Uploads each PDF to ada-pdfs/{payments/{paymentId}/{filename}} and returns
// signed URLs valid for 7 days. Bucket must exist and be private.
export async function uploadPdfsForPayment(
  paymentId: string,
  pdfs: TierPdf[],
): Promise<string[]> {
  const db = createServiceClient()
  const signedUrls: string[] = []

  for (const pdf of pdfs) {
    const path = `payments/${paymentId}/${pdf.filename}`

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, pdf.bytes, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      throw new Error(`Storage upload failed for ${pdf.filename}: ${uploadError.message}`)
    }

    const { data: signed, error: signError } = await db.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL)

    if (signError || !signed?.signedUrl) {
      throw new Error(`Signed URL creation failed for ${pdf.filename}: ${signError?.message}`)
    }

    signedUrls.push(signed.signedUrl)
  }

  return signedUrls
}

// ─── Main export: generate → upload → update DB ───────────────────────────────

// Full pipeline: builds PDFs for tier, uploads to Storage, writes signed URLs
// back to payments.pdf_urls. Returns the signed URLs for use in email delivery.
//
// email_deliveries.status stays 'pending' here — it flips to 'sent' when Resend
// delivers the email (implemented in the email delivery step, not this function).
// The DB schema only has 'pending' | 'sent' | 'failed'; no intermediate state needed.
export async function generatePdfsForTier(
  tier: 'basic' | 'premium' | 'monitoring',
  paymentId: string,
  evidenceData: EvidenceData,
  monitoringData?: MonitoringData,
): Promise<string[]> {
  // Enhance violations with plain-English descriptions via Claude Haiku (best-effort)
  const enhanced = await enhanceViolations(evidenceData.violations, evidenceData.url)
  const enrichedData: EvidenceData = { ...evidenceData, enhancedViolations: enhanced }

  // 1. Generate PDFs in memory
  const pdfs = await buildPdfsForTier(tier, enrichedData, monitoringData)

  // 2. Upload to Supabase Storage, get 7-day signed URLs
  const signedUrls = await uploadPdfsForPayment(paymentId, pdfs)

  // 3. Store signed URLs in payments table, keyed by document type
  const pdfUrlsMap: Record<string, string> = {}
  pdfs.forEach((pdf, i) => {
    // Strip .pdf suffix for cleaner keys: 'evidence-package', 'developer-guide', etc.
    pdfUrlsMap[pdf.filename.replace('.pdf', '')] = signedUrls[i]!
  })

  const db = createServiceClient()
  const { error: updateError } = await db
    .from('payments')
    .update({ pdf_urls: pdfUrlsMap })
    .eq('id', paymentId)

  if (updateError) {
    console.error('payments pdf_urls update error:', updateError)
    throw new Error(`Failed to save PDF URLs to payment ${paymentId}: ${updateError.message}`)
  }

  return signedUrls
}

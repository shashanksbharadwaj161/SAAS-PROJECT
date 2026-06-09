import {
  generateEvidencePackage,
  generateDevGuide,
  generateMonitoringConfirmation,
  type EvidenceData,
  type MonitoringData,
  type ViolationSummary,
} from '@saas/pdf'

export type { EvidenceData, MonitoringData, ViolationSummary }

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

// ─── Upload + signed URL functions ────────────────────────────────────────────
// Added after Supabase 'ada-pdfs' storage bucket is confirmed created.
//
// Manual step required before this code will work:
//   Supabase Dashboard → Storage → New bucket
//   Name:   ada-pdfs
//   Public: NO  (signed URLs only — never expose PDFs publicly)
//
// uploadPdfsForPayment() will be implemented here once the bucket is confirmed.

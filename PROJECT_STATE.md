# Project State

---

## Last Session: S3 — WCAG scan endpoint (2026-06-09)

**Goal:** WCAG scan endpoint — free scan that precedes any purchase.
**Status:** Complete. All three files written, type-checked clean (zero errors), committed and pushed.

---

## Files Changed This Session

```
apps/ada-tool/lib/scan.ts          ← NEW — scanUrl(): Chromium + axe-core, ScanError types
apps/ada-tool/lib/score.ts         ← NEW — calculateScore(), toViolationSummary(), ViolationSummary
apps/ada-tool/app/api/scan/route.ts ← NEW — POST handler, URL validation, rate limit, DB insert
apps/ada-tool/.env.example         ← Updated — added CHROMIUM_PACK_URL comment
packages/db/src/index.ts           ← Fixed — added Views/Functions keys (required by GenericSchema)
                                       and Relationships: [] to all table types (required by GenericTable)
```

---

## Bug Fixed This Session

**Supabase types all resolved to `never`** — The `Database['public']` type was missing `Views` and
`Functions` keys required by `GenericSchema`. Without them, the SupabaseClient generic collapses to
`Schema = never`, making every `.from().insert()` call typed as `never[]`. Fixed by adding empty
`Views: Record<string, never>` and `Functions: Record<string, never>` to `Database['public']`,
plus `Relationships: []` to all table definitions (required by `GenericTable`). This also fixed
the pre-existing type errors in the S2 Gumroad webhook route.

---

## Migrations Status

| File | Status |
|------|--------|
| 001_initial_schema.sql | ✅ Run — 6 tables created |
| 002_payments_gumroad.sql | ✅ Run — scan_id nullable, sale_id column, tier constraint |

---

## Key Architecture Decisions Made

- **Payment processor: Gumroad** (not Stripe). Webhook at `/api/webhook/gumroad`.
- **Scan function**: `maxDuration = 60`, `runtime = 'nodejs'`, 1024MB in vercel.json.
- **Rate limit**: 1 scan per IP per 60 seconds via ip_hash in `scans` table (SHA-256, no raw IP stored).
- **Chromium**: `@sparticuz/chromium-min` detects Vercel/Lambda via env vars; falls back to system Chrome locally.
- **axe.run() tags**: `wcag2a`, `wcag2aa`, `wcag21aa` only — no experimental tags.
- **Response**: top 3 violations only (free tier), never exposes `raw_results` column.
- **Timeout budget**: 45s total — 25s navigation, 37s axe race (8s overhead).
- **Coverage disclosure**: mandatory `coverageNote` on every successful scan response.

---

## Current Bugs

None known. Code is untested (environment can't reach external APIs — see risks).

---

## Remaining Risks

1. **Outbound network blocked in this execution environment** — Cannot test Supabase or any external
   service. All testing must happen locally or post-Vercel-deploy.
2. **Vercel Pro required before live** — Hobby bans commercial use + 10s timeout cap.
3. **Chromium pack URL pinned to v123** — If Vercel Lambda environment changes, update
   `CHROMIUM_PACK_URL` in Vercel env vars without a code deploy.

---

## Next Best Action: S4

**Goal:** ADA PDF generation — 3 documents using pdf-lib.

Tasks in order:

1. **`packages/pdf/src/index.ts`** — implement three generators:
   - `generateEvidenceReport(scan, payment)` → PDF 1: WCAG violation evidence with screenshots/details
   - `generateRemediationGuide(scan, payment)` → PDF 2 (premium only): dev fix instructions per violation
   - `generateAttorneyLetter(scan, payment)` → PDF 3: attorney-ready evidence cover letter
   - All three PDFs MUST include the legal disclaimer:
     "This report is a technical evidence package and does not constitute legal advice.
      Consult a qualified attorney for legal guidance."
   - All three PDFs MUST disclose: "Automated scanning detects approximately 57% of WCAG issues."

2. **`apps/ada-tool/app/api/generate-pdf/route.ts`** — POST handler:
   - Triggered after Gumroad webhook confirms payment
   - Fetches scan by `payment.scan_id` (or queues for when scan exists)
   - Calls pdf generators matching payment tier
   - Uploads PDFs to Supabase Storage (`PDF_STORAGE_BUCKET`)
   - Updates `payments.pdf_urls` with signed URLs
   - Updates `email_deliveries.status` → 'sent' after Resend delivery

3. **Email delivery** — wire up Resend to send PDFs after upload:
   - Use `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
   - Track daily count vs 100/day hard cap

4. After S4: verify `apps/ada-tool/app/api/webhook/gumroad/route.ts` triggers S4 correctly.

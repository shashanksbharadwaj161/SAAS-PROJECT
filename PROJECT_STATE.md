# Project State

---

## Last Session: S4 — PDF generation (2026-06-09)

**Goal:** PDF generation using pdf-lib — 3 documents per tier, mandatory legal disclaimers.
**Status:** Complete. All files written, type-checked clean, committed and pushed.

---

## Files Changed This Session

```
packages/pdf/src/index.ts              ← NEW — three PDF generators using pdf-lib
apps/ada-tool/lib/pdf/index.ts         ← NEW — tier routing, upload pipeline, DB update
```

---

## PDF Documents Generated Per Tier

| Tier | Documents |
|------|-----------|
| basic ($49) | evidence-package.pdf |
| premium ($79) | evidence-package.pdf + developer-guide.pdf |
| monitoring ($149) | evidence-package.pdf + developer-guide.pdf + monitoring-confirmation.pdf |

**evidence-package.pdf** — Cover + Legal Disclaimer + Executive Summary + Violations Detail (max 20)
**developer-guide.pdf** — Cover + Legal Disclaimer + Top 10 violations with Before/After code examples
**monitoring-confirmation.pdf** — Single-page activation confirmation with disclaimer footer

---

## Legal Compliance (enforced in packages/pdf/src/index.ts)

- Exact disclaimer text on Page 2 of every multi-page PDF: "This document is not legal advice..."
- Footer on EVERY page: "Not legal advice | axe-core ~57% WCAG coverage | Consult a qualified attorney"
- No forbidden language anywhere ("ADA compliant", "lawsuit-proof", "certified accessible")
- Coverage disclosure in executive summary and footer

---

## Supabase Storage

- Bucket: **ada-pdfs** ✅ Created (private, signed URLs only)
- Storage path: `payments/{paymentId}/{filename}.pdf`
- Signed URL TTL: 7 days
- `payments.pdf_urls` keys: `evidence-package`, `developer-guide`, `monitoring-confirmation`

---

## Migrations Status

| File | Status |
|------|--------|
| 001_initial_schema.sql | ✅ Run |
| 002_payments_gumroad.sql | ✅ Run |

---

## Key Architecture Decisions Made

- **Payment processor: Gumroad** (not Stripe). Webhook at `/api/webhook/gumroad`.
- **Scan function**: `maxDuration = 60`, `runtime = 'nodejs'`, 1024MB in vercel.json.
- **Rate limit**: 1 scan per IP per 60 seconds via ip_hash in `scans` table.
- **PDF storage**: private Supabase bucket `ada-pdfs`, signed URLs only (never public).
- **email_deliveries.status**: stays `'pending'` after PDF generation; flips to `'sent'` when Resend fires.
- **StandardFonts only**: Helvetica + HelveticaBold + Courier — no font embedding, no fontkit needed.
- **pdf-lib text wrapping**: custom `wrapText()` helper for Y-position tracking; enables pagination.

---

## Current Bugs

None known. Code is untested (environment can't reach external APIs — see risks).

---

## Remaining Risks

1. **Outbound network blocked in this execution environment** — all testing must happen locally or via Vercel.
2. **Vercel Pro required before live** — Hobby bans commercial use + 10s timeout cap.
3. **Gumroad webhook → PDF generation not yet wired** — webhook creates the payment record but doesn't
   call `generatePdfsForTier()`. This needs an API route or queue trigger (see S5 or add to webhook).
4. **Email delivery (Resend) not yet implemented** — PDFs are uploaded but never emailed. Implement in S5.

---

## Next Best Action: S5

**Goal:** ADA landing page + email delivery (Resend) + wire Gumroad → PDF → email pipeline.

Tasks in order:

### 5a. Wire the full purchase pipeline (critical — nothing ships without this)

1. Create `apps/ada-tool/app/api/generate-pdf/route.ts`
   - POST `{ paymentId: string }`
   - Fetch payment + scan from DB
   - Build `EvidenceData` from scan.raw_results
   - Call `generatePdfsForTier(tier, paymentId, evidenceData, monitoringData?)`
   - Trigger Resend email delivery (see 5b)
   - Return `{ success: true, urls: string[] }`

2. Update `apps/ada-tool/app/api/webhook/gumroad/route.ts`
   - After successful DB insert, call `/api/generate-pdf` internally (or inline the call)
   - Gumroad webhook must return within ~30s; consider background job if PDF gen is slow

3. Wire `email_deliveries.status` → `'sent'` after Resend confirmation

### 5b. Email delivery with Resend

- Send email with signed URL links (NOT attachments — PDFs can be large)
- Track daily send count against 100/day hard cap
- Template: "Your WCAG Evidence Package is ready — download links valid 7 days"
- Include the mandatory coverage disclosure in the email body

### 5c. ADA landing page

- `apps/ada-tool/app/page.tsx` — URL input form, scan trigger, score display
- Show top 3 violations (free tier), paywall for full report
- Gumroad payment link button (external link to Gumroad product page)
- WCAG coverage disclosure on the page
- Industry programmatic SEO: `apps/ada-tool/app/[industry]/page.tsx` already exists

### Pre-S5 check
- Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set in `.env.local`
- Confirm Gumroad product pages exist for $49 / $79 / $149 tiers

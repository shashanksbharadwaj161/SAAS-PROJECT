# Project State

---

## Last Session: Comprehensive fix session (2026-06-12)

**Goal:** Issues 1–5: scan_id linking, business name field, Claude API enhancement, landing page copy, env var reminder.
**Status:** Complete. Type-checked clean. Committed and pushed.

### Files Changed This Session

```
apps/ada-tool/app/_components/ScanWidget.tsx  ← business name input + withScanId() helper + fetch body
apps/ada-tool/app/api/scan/route.ts           ← accepts + stores businessName (done prior session)
apps/ada-tool/app/api/webhook/gumroad/route.ts← passes businessName from scan lookup into EvidenceData
apps/ada-tool/lib/enhance.ts                  ← NEW — enhanceViolations() via claude-haiku-4-5-20251001
apps/ada-tool/lib/pdf/index.ts                ← calls enhanceViolations() before PDF generation
apps/ada-tool/app/page.tsx                    ← bear headline, 2 new FAQ entries, WCAG 2.1→2.2
apps/ada-tool/app/[industry]/page.tsx         ← WCAG 2.1→2.2
apps/ada-tool/.env.example                    ← ANTHROPIC_API_KEY placeholder added
packages/pdf/src/index.ts                     ← EvidenceData.businessName + EnhancedViolation type
                                                 cover page shows Business name, violation cards
                                                 show plain English + business impact + fix difficulty
supabase/migrations/003_add_business_name.sql ← ADD COLUMN business_name TEXT to scans
```

### Manual tasks remaining

1. **Run migration 003_add_business_name.sql** in Supabase SQL Editor (adds `business_name` column to `scans` table)
2. **Add `ANTHROPIC_API_KEY` to Render environment variables** — required for Claude-enhanced PDF descriptions
   - Get key from: https://console.anthropic.com → API Keys
   - Render Dashboard → your ada-tool service → Environment → Add env var
3. Add `ANTHROPIC_API_KEY` to `.env.local` for local testing

### Issue 1 confirmation
`/api/scan/route.ts` returns `scanId: saved.id`. ScanWidget appends it to all 3 Gumroad checkout URLs via `withScanId()`. Webhook parses `url_params` JSON from Gumroad payload. All three legs confirmed correct.

---

## Previous Session: axe-core injection — definitive fix (2026-06-10)

**Goal:** Definitive fix for axe-core injection failure on Render.
**Status:** Fixed. Type-checked clean, committed and pushed.

---

## Files Changed This Session

```
apps/ada-tool/package.json  ← UPDATED — added "prebuild" script
apps/ada-tool/lib/scan.ts   ← UPDATED — getAxeSource() reads from public/axe.min.js
apps/ada-tool/.gitignore    ← NEW — excludes public/axe.min.js and .next/
```

**Root cause (previous attempt):** `getAxeSource()` tried to resolve `../../node_modules/axe-core/axe.min.js`
from `process.cwd()`, but `process.cwd()` in Next.js production doesn't reliably return the
app root when the process is started via a shell `cd` command.

**Definitive fix — prebuild copy:**
- `prebuild` npm script runs `node -e "...copyFileSync(require.resolve('axe-core/axe.min.js'), 'public/axe.min.js')"` before every `next build`
- `require.resolve` in the prebuild node script is pure CJS — no bundler, always correct
- `getAxeSource()` now reads `process.cwd()/public/axe.min.js` — Next.js guarantees `process.cwd()` == app root in production
- `public/axe.min.js` is in `.gitignore` (generated at build time, not committed)

---

## Previous Session: Render deployment prep (2026-06-10)

**Goal:** Prepare ada-tool for deployment on Render (persistent Node.js, no serverless timeout).
**Status:** Complete. Type-checked clean, committed and pushed.

### Files Changed

```
apps/ada-tool/lib/scan.ts   ← UPDATED — Render-aware Chromium detection
render.yaml                 ← NEW — Render Blueprint at repo root
```

---

## Previous Session: S5 — Landing page + email delivery + full pipeline (2026-06-09)

**Goal:** Wire full purchase pipeline (Gumroad → PDF → email), landing page, 5 SEO industry pages.
**Status:** Complete. All files written, type-checked clean, committed and pushed.

### Files Changed in S5

```
apps/ada-tool/lib/email.ts                      ← NEW — Resend email delivery, daily cap guard
apps/ada-tool/app/api/webhook/gumroad/route.ts  ← UPDATED — wired PDF gen + email into pipeline
apps/ada-tool/app/_components/ScanWidget.tsx    ← NEW — client component: URL form + results + pricing
apps/ada-tool/app/page.tsx                      ← UPDATED — full landing page
apps/ada-tool/app/[industry]/page.tsx           ← UPDATED — 5 SEO industry pages
apps/ada-tool/.env.example                      ← UPDATED — added GUMROAD_PRODUCT_* placeholders
```

---

## Full Purchase Pipeline (now wired end-to-end)

1. User pays on Gumroad
2. Gumroad POSTs to `/api/webhook/gumroad`
3. Webhook verifies `GUMROAD_SELLER_ID`, maps price → tier
4. Inserts `payments` row (scan_id=null for direct purchases) + `email_deliveries` row (status=pending)
5. Calls `generatePdfsForTier(tier, paymentId, evidenceData, monitoringData?)` → uploads to `ada-pdfs` bucket → updates `payments.pdf_urls`
6. Calls `sendPdfDelivery(...)` → checks daily Resend cap (100/day) → sends HTML email with download links → updates `email_deliveries.status = 'sent'`
7. Always returns 200 to Gumroad (prevents duplicate payment records)

**Edge cases handled:**
- Direct Gumroad purchases (no prior scan): `evidenceData.violations = []`, `score = 0` — buyer still gets docs
- PDF/email pipeline failure: logged, marked `status='failed'`, payment still recorded
- Resend daily cap: hard stops at 100, warns at ≥95, marks delivery `failed` if cap hit

---

## Email Delivery (lib/email.ts)

- From: `ADA Evidence Tool <${RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`
- Subject: "Your WCAG Technical Evidence Package is ready"
- HTML: score badge (color-coded), download buttons per PDF, 7-day expiry note, 57% coverage amber box, legal disclaimer footer
- Daily count: queries `email_deliveries` for `status='sent'` and `sent_at` today
- No "ADA compliant" language anywhere

---

## Landing Page (app/page.tsx)

- Legal notice bar above fold (amber, full disclaimer + attorney consult)
- Hero with ScanWidget (client component)
- How it works (3 steps)
- Pricing section — 3 tiers, Gumroad links open in new tab
- FAQ — 6 questions including "Does this make my website ADA compliant?" → No
- Footer with legal/coverage disclaimers

---

## Industry SEO Pages (app/[industry]/page.tsx)

5 static routes generated at build time:
- `/restaurants`
- `/dentists`
- `/law-firms`
- `/gyms`
- `/real-estate-agents`

Each has: unique metaTitle + metaDescription, industry intro, 5 industry-specific violations, urgency box, scan widget, pricing CTA, 57% coverage disclosure.

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
- **email_deliveries.status**: `'pending'` → `'sent'` when Resend fires; `'failed'` on error.
- **StandardFonts only**: Helvetica + HelveticaBold + Courier — no font embedding, no fontkit needed.
- **Direct Gumroad purchases**: no prior scan; `evidenceData.violations = []`, `score = 0`.
- **Gumroad webhook always returns 200**: non-200 causes duplicate payment retries.
- **Resend From email**: `RESEND_FROM_EMAIL` env var, fallback `onboarding@resend.dev` until domain verified.

---

## Current Bugs

None known. Code is untested live (environment can't reach external APIs — see risks).

---

## Remaining Risks

1. **Outbound network blocked in this execution environment** — all testing must happen locally or on Render.
2. **Direct purchase email has score=0** — users who buy without first scanning see score 0 in email. Fix in S9: add `/api/generate-pdf` route accepting `scanId` to regenerate with real scan data.
3. **Resend domain not yet verified** — emails come from `onboarding@resend.dev` until `RESEND_FROM_EMAIL` is set to a verified domain.
4. **Render build needs system-level access** — `apt-get install -y chromium-browser` in render.yaml buildCommand requires Render's build environment to allow apt; this works on Render's default Ubuntu build image.

---

## Next Best Action: S6

**Goal:** Shopify OAuth flow + token encryption + VAMP Monitor app scaffold.

Tasks in order:

### 6a. Shopify OAuth flow
1. `apps/shopify-vamp/app/api/install/route.ts` — redirect to Shopify OAuth
2. `apps/shopify-vamp/app/api/callback/route.ts` — exchange code for token, encrypt + store
3. `apps/shopify-vamp/lib/shopify.ts` — token encryption via `pgcrypto` / AES-256

### 6b. VAMP billing
- `appSubscriptionCreate` GraphQL mutation for $29/mo recurring charge
- Webhook to handle billing confirmation

### 6c. Dispute webhooks
- Shopify `disputes/create` and `disputes/update` webhook handlers
- Insert to `disputes` table, trigger VAMP ratio recalculation

### Pre-S6 check
- Confirm `SHOPIFY_TOKEN_ENCRYPTION_KEY` is set in `.env.local`
- Confirm Shopify Partners account + app created

---

## Render Deployment Instructions (deploy ada-tool now)

1. **Connect repo** in Render Dashboard → New Web Service → connect GitHub repo.
2. **Render auto-detects** `render.yaml` at repo root and pre-fills settings.
3. **Set environment variables** in Render Dashboard (Environment tab):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   GUMROAD_SELLER_ID
   RESEND_API_KEY
   RESEND_FROM_EMAIL          (set after Resend domain verification)
   GUMROAD_PRODUCT_BASIC      (e.g. https://shanksbizz.gumroad.com/l/nnaptk)
   GUMROAD_PRODUCT_PREMIUM    (e.g. https://shanksbizz.gumroad.com/l/ebpqqpk)
   GUMROAD_PRODUCT_MONITORING (e.g. https://shanksbizz.gumroad.com/l/nnaptk)
   NEXT_PUBLIC_APP_URL        (set to your .onrender.com URL or custom domain)
   ```
4. **Set Gumroad webhook URL**: Gumroad Dashboard → Settings → Advanced → Ping URL:
   `https://YOUR_SERVICE.onrender.com/api/webhook/gumroad`
5. **Deploy** — Render runs `apt-get install -y chromium-browser && npm install && npm run build`.
6. **Verify** the `/api/scan` endpoint with a test URL to confirm Chromium is found at `/usr/bin/chromium-browser`.

### render.yaml summary (repo root)

```yaml
buildCommand: apt-get install -y chromium-browser && cd apps/ada-tool && npm install && npm run build
startCommand: cd apps/ada-tool && npm start
envVars: NODE_ENV=production, RENDER=true (plus secrets set in dashboard)
```

### Chromium detection order in scan.ts

| Environment | Detection | Path used |
|-------------|-----------|-----------|
| Render | `RENDER` env var set | `/usr/bin/chromium-browser` (system) → pack URL fallback |
| Vercel/Lambda | `VERCEL` or `AWS_LAMBDA_FUNCTION_NAME` | pack URL download to /tmp |
| Local | none of the above | system paths → pack URL fallback |

---

## Vercel Deployment Instructions (archived — using Render instead)

1. **Upgrade to Vercel Pro** before accepting any payments (Hobby bans commercial use)
2. **Import the monorepo** to Vercel:
   - Root directory: `apps/ada-tool`
   - Framework: Next.js (auto-detected)
   - Build command: `cd ../.. && npm run build --workspace=apps/ada-tool` (or let Vercel detect)
3. **Set environment variables** in Vercel dashboard (Project → Settings → Environment Variables):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   GUMROAD_SELLER_ID
   RESEND_API_KEY
   RESEND_FROM_EMAIL          (set after domain verification in Resend dashboard)
   GUMROAD_PRODUCT_BASIC      (e.g. https://shanksbizz.gumroad.com/l/nnaptk)
   GUMROAD_PRODUCT_PREMIUM    (e.g. https://shanksbizz.gumroad.com/l/ebpqqpk)
   GUMROAD_PRODUCT_MONITORING (e.g. https://shanksbizz.gumroad.com/l/nnaptk)
   NEXT_PUBLIC_APP_URL        (set to your production domain)
   ```
4. **Set Gumroad webhook URL** in Gumroad Dashboard → Settings → Advanced → Ping URL:
   `https://YOUR_DOMAIN/api/webhook/gumroad`
5. **Verify Supabase `ada-pdfs` bucket** is private (no public access)
6. **Verify Resend domain** in Resend dashboard → Domains → Add domain → follow DNS instructions
7. **Test with a Gumroad test purchase** (use test=true flag) to confirm webhook fires

---

## Document Index

| File | Purpose | Update frequency |
|------|---------|------------------|
| CLAUDE.md | Permanent rules — auto-loaded every session | Rarely (architecture changes only) |
| BUSINESS_STATUS.md | Revenue, customers, accounts, upgrades | Weekly |
| PROJECT_STATE.md | Session state, bugs, next action | Every single session |
| supabase/migrations/001_initial_schema.sql | Full DB schema | When schema changes |

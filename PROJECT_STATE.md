# Project State

---

## Last Session: S2 — Gumroad webhook + DB types (2026-06-09)

**Goal:** Environment setup complete + Gumroad webhook handler + typed Supabase clients.
**Status:** Complete. Code written and committed. Migration 002 must be run before testing.

---

## Files Changed This Session

```
apps/ada-tool/.env.local                             ← CREATED (gitignored) — real Supabase keys + GUMROAD_SELLER_ID
apps/ada-tool/.env.example                          ← Updated — removed Stripe, added Gumroad
apps/ada-tool/app/api/webhook/gumroad/route.ts      ← NEW — Gumroad POST webhook handler
packages/db/src/index.ts                            ← Implemented — typed Database interface + service/browser clients
supabase/migrations/002_payments_gumroad.sql        ← NEW — must be run in Supabase SQL Editor

CLAUDE.md                                           ← Updated — payment processor is Gumroad, not Stripe
```

---

## Migrations Status

| File | Status |
|------|--------|
| 001_initial_schema.sql | ✅ Run — 6 tables created |
| 002_payments_gumroad.sql | ⚠️ Must be run before testing webhook |

**002 changes:** scan_id nullable, stripe_payment_intent_id → sale_id, tier constraint updated (pro → premium).

---

## Key Architecture Decisions Made

- **Payment processor: Gumroad** (not Stripe). Webhook at `/api/webhook/gumroad`.
- Gumroad sends `application/x-www-form-urlencoded`. Verified via `seller_id` match.
- Test purchases (`test=true`) return 200 but skip DB writes.
- Unknown prices return 200 + skip (prevents Gumroad from retrying forever).
- `scan_id` is nullable — Gumroad sales arrive before any scan record exists.
- Payment 500 → Gumroad retries. Email delivery failure → non-fatal, logged only.

---

## Current Bugs

None known. Code is untested (environment can't reach external APIs — see risks).

---

## Remaining Risks

1. **Outbound network blocked in this execution environment** — Cannot test Supabase, Gumroad,
   or any external service from here. All testing must happen locally or post-Vercel-deploy.
2. **Migration 002 not yet run** — webhook will fail with DB column name mismatch until run.
3. **Vercel Pro required before live** — Hobby bans commercial use + 10s timeout cap.
4. **`apps/ada-tool/app/api/webhook/stripe/route.ts`** — dead stub (Stripe not used).
   Delete it to avoid confusion.
5. **SHOPIFY_TOKEN_ENCRYPTION_KEY** — Still needed before S6. Generate before then.

---

## Next Best Action: S3

**Goal:** WCAG scan endpoint — the free scan that precedes any purchase.

Tasks in order:
1. Implement `apps/ada-tool/lib/scan.ts`:
   - Launch headless Chromium via `@sparticuz/chromium-min` + `puppeteer-core`
   - Navigate to target URL, inject axe-core, call `axe.run()`
   - Return `{ violations, incomplete, passes }` from axe
2. Implement `apps/ada-tool/lib/score.ts`:
   - Compute weighted score: critical×10, serious×5, moderate×3, minor×1
   - Normalize to 0–100
3. Implement `apps/ada-tool/app/api/scan/route.ts`:
   - POST `{ url: string }`
   - Validate + sanitize URL (must be http/https, no localhost)
   - Hash IP for rate limiting (store as `ip_hash`)
   - Call `lib/scan.ts` → `lib/score.ts`
   - INSERT into `scans` table via `@saas/db` service client
   - Return: `{ scanId, score, violations (top 3 for free tier), incomplete count, coverageNote }`
   - `coverageNote`: "Automated scanning detects approximately 57% of WCAG issues."
4. Confirm `export const maxDuration = 60` and `export const runtime = 'nodejs'` are in route
5. Confirm `vercel.json` memory config is correct (1024MB)

**Pre-S3 manual step:** Run migration 002 in Supabase SQL Editor.

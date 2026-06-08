# Project State

---

## Last Session: S1 — Scaffold (2026-06-08)

**Goal:** Scaffold full monorepo structure, Supabase schema, session management files.
**Status:** Complete. Zero code executed, zero packages installed. Pure structure.

---

## Files Created This Session

```
package.json                                         ← root npm workspaces config
.gitignore                                           ← covers .env, node_modules, .next, chromium
CLAUDE.md                                            ← permanent session rules
BUSINESS_STATUS.md                                   ← revenue/account tracker
PROJECT_STATE.md                                     ← this file
supabase/migrations/001_initial_schema.sql           ← all 6 tables + RLS policies

apps/ada-tool/package.json
apps/ada-tool/next.config.js                         ← serverExternalPackages for chromium
apps/ada-tool/tsconfig.json
apps/ada-tool/.env.example
apps/ada-tool/vercel.json                            ← 1024MB memory, 60s maxDuration for scan route
apps/ada-tool/app/layout.tsx
apps/ada-tool/app/page.tsx
apps/ada-tool/app/[industry]/page.tsx
apps/ada-tool/app/api/scan/route.ts
apps/ada-tool/app/api/checkout/route.ts
apps/ada-tool/app/api/webhook/stripe/route.ts
apps/ada-tool/lib/scan.ts                            ← lib/ at app level, NOT inside app/
apps/ada-tool/lib/score.ts
apps/ada-tool/lib/pdf/index.ts

apps/shopify-vamp/package.json
apps/shopify-vamp/next.config.js
apps/shopify-vamp/tsconfig.json
apps/shopify-vamp/.env.example
apps/shopify-vamp/app/layout.tsx
apps/shopify-vamp/app/page.tsx
apps/shopify-vamp/app/api/auth/route.ts
apps/shopify-vamp/app/api/webhooks/disputes/route.ts
apps/shopify-vamp/app/api/billing/route.ts
apps/shopify-vamp/lib/vamp.ts                        ← lib/ at app level, NOT inside app/
apps/shopify-vamp/lib/shopify.ts

packages/ui/package.json + tsconfig.json + src/index.ts
packages/pdf/package.json + tsconfig.json + src/index.ts
packages/db/package.json + tsconfig.json + src/index.ts      ← Supabase client stubs
packages/stripe/package.json + tsconfig.json + src/index.ts  ← Stripe client stub
```

---

## Commands Run This Session

- File writes only. No npm install. No git commands (done separately).

---

## Current Bugs

None — no code executed yet.

---

## Remaining Risks

1. **Vercel Pro required before first payment** — Hobby bans commercial use + 10s timeout cap.
   Do NOT go live on Hobby. Upgrade the day of first payment.
2. **Supabase 2-project limit** — Create separate projects for ada-tool and shopify-vamp
   before production. For dev, one project is fine.
3. **Supabase projects auto-pause after 7 days** — Set up GitHub Actions cron ping after S2.
4. **SHOPIFY_TOKEN_ENCRYPTION_KEY** — Must be generated and stored in Vercel env vars before S6.
   Never commit. See apps/shopify-vamp/.env.example for generation command.
5. **npm install not yet run** — packages/db/src/index.ts has real Supabase import that won't
   resolve until `npm install` is run. Run after confirming this scaffold is correct.

---

## Next Best Action: S2

**Goal:** Make Stripe work end-to-end for ADA Tool.

Tasks in order:
1. `npm install` from repo root (installs all workspace dependencies)
2. Implement `packages/stripe/src/index.ts`:
   - `createCheckoutSession({ tier, scanId, email, successUrl, cancelUrl })`
   - `constructWebhookEvent(rawBody, signature)`
3. Implement `apps/ada-tool/app/api/checkout/route.ts`:
   - Parse + validate `{ tier, scanId, email }`
   - Create Stripe Checkout Session (mode:'payment' for basic/pro, mode:'subscription' for monitoring)
   - Return `{ checkoutUrl }`
4. Implement `apps/ada-tool/app/api/webhook/stripe/route.ts`:
   - Verify signature
   - Handle `checkout.session.completed`
   - INSERT payment row
   - Queue PDF generation (stub for now — PDF builds in S4)
   - Queue email delivery (stub for now — Resend integrates in S4)
5. Update `packages/db/src/index.ts` with TypeScript types for `scans` and `payments` tables
6. Run Supabase SQL migration manually (see instructions below)
7. Test end-to-end with Stripe test keys

**Before starting S2:** Create Supabase project(s) and run the SQL migration. Get SUPABASE_URL,
ANON_KEY, SERVICE_ROLE_KEY. Get Stripe test keys. Fill in apps/ada-tool/.env.local.

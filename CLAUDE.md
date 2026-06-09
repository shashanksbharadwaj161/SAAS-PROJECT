# CLAUDE.md — Permanent Session Rules

> Read this file at the start of EVERY session, before writing any code.
> Then read PROJECT_STATE.md to know exactly where you left off.

---

## Projects

### Product 1: ADA Legal Response Package (ADA Tool) — ship first
Target: Small business owners who received ADA demand letters.
Flow: Enter URL → free WCAG scan → pay → receive 3 PDFs.
Pricing: Free (score + top 3 violations) | $49 (3 PDFs) | $79 (PDFs + dev fix instructions) | $149/mo (monitoring).
Legal framing: "Technical Evidence Package" — NEVER "legal advice" or "ADA compliant".

### Product 2: VAMP Monitor for Shopify — ship second
Target: Shopify merchants tracking dispute/fraud ratio vs Visa VAMP thresholds.
Features: Real-time ratio tracker, end-of-month breach projector.
Pricing: $29/mo via Shopify Billing API (EVERY_30_DAYS recurring).

---

## Tech Stack (non-negotiable)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 App Router | TypeScript strict mode; params/searchParams are Promises in 15 |
| Database + Auth | Supabase | 500MB DB, 5GB egress, 50K MAU, 2 projects max |
| Payments (ADA) | Stripe Checkout | mode:'payment' one-time + mode:'subscription' monitoring |
| Payments (VAMP) | Shopify Billing API | appSubscriptionCreate GraphQL mutation |
| Email | Resend | 3,000/mo, 100/day hard cap — build queue fail-safe |
| PDF | pdf-lib | Open source, runs on Vercel Node.js runtime |
| WCAG scan | axe-core + puppeteer-core + @sparticuz/chromium-min | NOT full puppeteer — exceeds 50MB bundle |
| Hosting | Vercel | Hobby now → Pro the day of first payment |
| Monorepo | npm workspaces | NOT Yarn, NOT pnpm |
| Node | LTS (≥20) | |

### Critical Vercel constraints
- Hobby plan BANS commercial use → move to Pro the day of first payment, no exceptions
- Hobby timeout = 10s → ADA scan needs 60s → requires Vercel Pro before going live
- Scan function config: `export const maxDuration = 60`, `export const runtime = 'nodejs'`
- Memory (1024MB) set in `apps/ada-tool/vercel.json` functions config

---

## Monorepo Structure

```
saas-project/
├── apps/
│   ├── ada-tool/
│   │   ├── app/           ← Next.js App Router (pages + API routes)
│   │   └── lib/           ← scan.ts, score.ts, pdf/ — NOT inside app/
│   └── shopify-vamp/
│       ├── app/
│       └── lib/           ← vamp.ts, shopify.ts — NOT inside app/
├── packages/
│   ├── ui/                ← @saas/ui  (shared React components)
│   ├── pdf/               ← @saas/pdf (pdf-lib generators)
│   ├── db/                ← @saas/db  (Supabase client + types)
│   └── stripe/            ← @saas/stripe (Stripe helpers)
├── supabase/migrations/
├── CLAUDE.md              ← this file (permanent, never delete)
├── BUSINESS_STATUS.md
└── PROJECT_STATE.md
```

---

## Hard Rules (enforce every session, no exceptions)

1. **Always read CLAUDE.md and PROJECT_STATE.md before writing any code.**
2. **Never commit `.env` files or real secrets.** Only `.env.example` with placeholder values.
3. **Never store Shopify `access_token` unencrypted.** Encrypt via pgcrypto in `lib/shopify.ts`. Key lives in `SHOPIFY_TOKEN_ENCRYPTION_KEY` env var.
4. **Never write "ADA compliant", "lawsuit-proof", or "legally protected"** anywhere in the product, marketing copy, or PDFs.
5. **Every ADA-related PDF must include:** "This report is a technical evidence package and does not constitute legal advice. Consult a qualified attorney for legal guidance."
6. **Always disclose axe-core's ~57% WCAG coverage.** Frame incomplete results as "requires manual review". Never imply full coverage.
7. **Git commit after every working feature.** Commits are the durable checkpoint.
8. **End every session by updating PROJECT_STATE.md** with: files changed, commands run, current bugs, exact next action.

---

## ADA Legal Compliance Rules

- axe-core detects ~57% of WCAG issues automatically (Deque's own figure, 2,000+ audits, 300K issues)
- Frame results as "technical evidence of remediation effort" — not a compliance certificate
- Incomplete/manual-review items → "requires manual accessibility audit"
- Safe language: "good-faith assessment", "WCAG 2.1 AA analysis", "Technical Evidence Package", "demonstrates remediation effort"
- Forbidden language: "ADA compliant", "lawsuit-proof", "legally protected", "certified accessible", "passes ADA requirements"

---

## VAMP Thresholds (as of April 1 2026 — re-verify before shipping)

- Excessive threshold: **1.5%** (dropped from 2.2% on April 1 2026)
- Fine: **$8 per** disputed/fraudulent transaction, no warning tier
- Enrollment floor: merchants with <1,500 TC40+TC15 events/month are NOT enrolled in VAMP
- Formula: VAMP ratio = (TC40 fraud + TC15 disputes) ÷ TC05 settled CNP transactions
- Regional note: US/Canada/EU/APAC use 1.5% threshold; CEMEA stays at 2.20%
- Alert tiers in dashboard: green <1.0% | yellow 1.0–1.5% | red ≥1.5%
- Fine projection: (events over implied allowance) × $8

---

## Supabase Free Tier Limits (monitor actively)

- 500MB database storage — never store uncompressed assets in DB
- 5GB monthly egress bandwidth — cache aggressively on Vercel edge, never load assets from DB directly
- 50,000 monthly active users
- 2 active projects max — one per product in production, one project covers both in dev
- Projects auto-pause after 7 days inactivity → add GitHub Actions cron to ping every 3 days

## Resend Limits (build fail-safes in code)

- 3,000 emails/month max
- 100 emails/day hard cap — app MUST queue non-essential emails when approaching this limit
- 1 verified sending domain

---

## Shopify Revenue Share (as of Jan 1 2025)

- 0% on first $1,000,000 USD lifetime gross app revenue
- 15% on revenue above $1M (one-time $19 App Store registration fee)
- Plus 2.9% processing fee on all billing

---

## Session Build Plan

| Session | Focus | Status |
|---------|-------|--------|
| S1 | Scaffold monorepo + Supabase schema + session files | ✅ Done |
| S2 | Stripe shared package + Checkout session + webhook | 🔲 Next |
| S3 | ADA scan endpoint (axe-core + puppeteer-core) | 🔲 |
| S4 | ADA PDF generation (pdf-lib, 3 documents) | 🔲 |
| S5 | ADA landing page + industry programmatic SEO pages | 🔲 |
| S6 | Shopify OAuth flow + token encryption | 🔲 |
| S7 | Dispute webhooks + VAMP ratio calculation | 🔲 |
| S8 | Shopify billing (appSubscriptionCreate) | 🔲 |
| S9 | Dashboard UI for VAMP + ADA scan results | 🔲 |
| S10 | Polish, Shopify app submission, production deploy | 🔲 |

---

## Document Index

| File | Purpose | Update frequency |
|------|---------|------------------|
| CLAUDE.md | Permanent rules — auto-loaded every session | Rarely (architecture changes only) |
| BUSINESS_STATUS.md | Revenue, customers, accounts, upgrades | Weekly |
| PROJECT_STATE.md | Session state, bugs, next action | Every single session |
| supabase/migrations/001_initial_schema.sql | Full DB schema | When schema changes |

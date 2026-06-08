# Business Status

Last updated: 2026-06-08 — Session S1

---

## Revenue

| Metric | Value |
|--------|-------|
| Monthly Recurring Revenue (MRR) | $0 |
| Total Revenue (all time) | $0 |
| ADA Tool paying customers | 0 |
| VAMP Monitor Shopify installs | 0 |

---

## Product Status

| Product | Status | Blocker |
|---------|--------|---------|
| ADA Tool | Scaffolded — not live | Needs S3 (scan), S4 (PDF), S5 (landing page) |
| VAMP Monitor | Scaffolded — not live | Needs S6–S8, then Shopify review queue (5–10 days) |

---

## Account Setup Checklist

- [x] GitHub (repo: shashanksbharadwaj161/saas-project)
- [ ] Supabase — create 2 projects: `ada-tool` and `shopify-vamp`
        Run: supabase/migrations/001_initial_schema.sql in each project's SQL editor
- [ ] Stripe — sign up, enter business details, add bank account for payouts
- [ ] Resend — sign up, add sending domain, paste DNS records at registrar
- [ ] Vercel — sign up, connect GitHub, deploy both apps (Hobby now → Pro before first payment)
- [ ] Shopify Partner account — sign up free at partners.shopify.com
        $19 App Store registration fee — pay when ready to submit for review (S10)
- [ ] Reddit — create anonymous account NOW and let it age 2–4 weeks before promoting

---

## Infrastructure Upgrade Triggers

| Trigger | Action |
|---------|--------|
| First paying customer | Move to Vercel Pro ($20/mo) — Hobby bans commercial use |
| MRR reliably > $300 | Upgrade to Claude Max 5x ($100/mo) |
| Each product's first $100 | Buy a .com domain (~$12/yr each) |
| DB approaches 400MB or egress approaches 4GB/mo | Upgrade Supabase to Pro ($25/mo) |

---

## Marketing Status

| Channel | Status |
|---------|--------|
| Reddit account (anonymous) | Not created |
| ADA Tool SEO pages | Not built |
| VAMP Tool SEO pages | Not built |
| Answer Engine Optimization (AEO) | Not started |

---

## Current Sprint

**S1 complete.** Next: S2 — Stripe shared package (`packages/stripe/`) + ADA Tool checkout endpoint + webhook handler.

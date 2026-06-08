// S2: Stripe Checkout session creation
// POST { tier: 'basic'|'pro'|'monitoring', scanId: string, email: string }
//   → { checkoutUrl: string }
//
// Tiers:
//   basic      → $49 one-time   (mode: 'payment')  — 3 PDFs
//   pro        → $79 one-time   (mode: 'payment')  — 3 PDFs + dev fix instructions
//   monitoring → $149/mo        (mode: 'subscription') — ongoing WCAG monitoring

export async function POST(_request: Request) {
  // TODO S2:
  // 1. Parse + validate { tier, scanId, email }
  // 2. Verify scanId exists in scans table (prevents checkout without a real scan)
  // 3. Create Stripe Checkout Session with correct mode and price ID
  // 4. Set metadata: { scanId, tier, email } for webhook reconciliation
  // 5. Return { checkoutUrl }
  return Response.json({ error: 'Not implemented — build in S2' }, { status: 501 })
}

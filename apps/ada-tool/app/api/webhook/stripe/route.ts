// S2: Stripe webhook handler
// POST from Stripe → verify signature → handle checkout.session.completed
//
// Flow on checkout.session.completed:
//   1. Verify stripe-signature header (STRIPE_WEBHOOK_SECRET) — reject if invalid
//   2. Extract { scanId, tier, email } from session.metadata
//   3. INSERT payment row into payments table
//   4. Trigger PDF generation (calls @saas/pdf generators from packages/pdf)
//   5. Upload PDFs to Supabase Storage (PDF_STORAGE_BUCKET)
//   6. Update payments.pdf_urls with signed download URLs
//   7. INSERT email_deliveries row + send via Resend
//      — check daily email count before sending (100/day hard cap)

export async function POST(_request: Request) {
  // TODO S2: implement signature verification + checkout.session.completed handler
  // Always return 200 quickly to Stripe — do heavy work async or after response
  return Response.json({ received: true })
}

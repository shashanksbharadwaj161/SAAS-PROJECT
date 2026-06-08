// @saas/stripe — shared Stripe helpers
// Build in S2:
//   createStripeClient()             — singleton Stripe instance
//   createCheckoutSession(params)    — Checkout Session for basic/pro/monitoring tiers
//   constructWebhookEvent(raw, sig)  — verify + parse incoming Stripe webhooks

import Stripe from 'stripe'

export function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY!
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

// TODO S2: implement createCheckoutSession, constructWebhookEvent

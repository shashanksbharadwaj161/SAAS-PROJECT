// S8: Shopify Billing API — subscription creation
// POST { shop: string } → { confirmationUrl: string }
//
// Flow:
//   1. Look up shop access token (decrypt via lib/shopify.ts)
//   2. Run appSubscriptionCreate GraphQL mutation:
//        mutation { appSubscriptionCreate(
//          name: "VAMP Monitor - $29/mo",
//          lineItems: [{ plan: { appRecurringPricingDetails: {
//            price: { amount: 29.00, currencyCode: USD },
//            interval: EVERY_30_DAYS
//          }}}],
//          returnUrl: "{APP_URL}/billing/confirm",
//          test: true   ← set false in production
//        ) { confirmationUrl appSubscription { id status } } }
//   3. Return { confirmationUrl } → frontend redirects merchant to approve
//   4. Subscribe to APP_SUBSCRIPTIONS_UPDATE webhook to activate plan in shops table
//
// Note: Shopify 0% revenue share on first $1M lifetime (as of Jan 1 2025)

export async function POST(_request: Request) {
  // TODO S8: implement appSubscriptionCreate mutation + return confirmationUrl
  return Response.json({ error: 'Not implemented — build in S8' }, { status: 501 })
}

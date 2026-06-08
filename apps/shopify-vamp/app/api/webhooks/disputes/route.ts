// S7: Shopify dispute webhook handler
// Handles: disputes/create + disputes/update
//
// MUST verify HMAC-SHA256 signature before processing:
//   1. Get raw body bytes
//   2. HMAC-SHA256(rawBody, SHOPIFY_API_SECRET) → base64
//   3. Compare to X-Shopify-Hmac-Sha256 header (timing-safe comparison)
//   4. Reject with 401 if invalid
//
// On valid webhook:
//   1. Extract shop domain from X-Shopify-Shop-Domain header
//   2. Look up shop in Supabase (service client)
//   3. UPSERT dispute row: { shop_id, shopify_dispute_id, amount, status, type, raw_data }
//   4. Trigger VAMP ratio recalculation for current month (lib/vamp.ts)
//   5. Update vamp_snapshots table
//
// Return 200 quickly — Shopify retries on non-2xx responses

export async function POST(_request: Request) {
  // TODO S7: implement HMAC verification + dispute upsert + VAMP recalculation
  return new Response(null, { status: 200 })
}

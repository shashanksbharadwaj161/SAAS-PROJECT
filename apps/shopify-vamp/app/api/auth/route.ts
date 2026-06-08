// S6: Shopify OAuth flow
//
// GET ?shop=mystore.myshopify.com
//   → validate shop param
//   → redirect to https://{shop}/admin/oauth/authorize?client_id=...&scope=...&redirect_uri=...&state={nonce}
//
// GET ?code=...&hmac=...&shop=...&state=...
//   → verify HMAC-SHA256 signature using SHOPIFY_API_SECRET
//   → verify state nonce matches (prevent CSRF)
//   → POST to https://{shop}/admin/oauth/access_token to exchange code
//   → encrypt token: pgp_sym_encrypt(token, SHOPIFY_TOKEN_ENCRYPTION_KEY) via pgcrypto
//   → UPSERT shop row in Supabase shops table with encrypted token
//   → register disputes/create + disputes/update webhooks
//   → redirect to dashboard
//
// Required scopes: read_shopify_payments_disputes, read_orders

export async function GET(_request: Request) {
  // TODO S6: implement OAuth initiation + callback handling
  return Response.json({ error: 'Not implemented — build in S6' }, { status: 501 })
}

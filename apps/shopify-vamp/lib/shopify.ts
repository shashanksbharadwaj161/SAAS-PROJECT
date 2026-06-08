// S6: Shopify API client and token encryption
//
// Token encryption:
//   - Encryption key lives in SHOPIFY_TOKEN_ENCRYPTION_KEY env var (min 32 chars)
//   - Use pgcrypto pgp_sym_encrypt(token, key) when writing to Supabase
//   - Use pgcrypto pgp_sym_decrypt(encrypted_token, key) when reading
//   - NEVER log or return decrypted tokens
//   - NEVER store plaintext in shops.access_token
//
// GraphQL queries to implement (S7):
//   - shopifyPaymentsAccount.disputes — dispute list with status, type, amount, evidenceDueBy
//   - orders — total transaction count for VAMP denominator
//   Endpoint: POST /admin/api/2026-04/graphql.json
//   Header:   X-Shopify-Access-Token: {decrypted_token}
//
// Test card for dev store disputes: 4000000000000259

export {}
// TODO S6: implement encryptToken, decryptToken, shopifyGraphQL, registerWebhooks

/** Checkout URLs for the three tiers, read from GUMROAD_PRODUCT_* env vars. */
export interface GumroadUrls {
  basic: string
  premium: string
  monitoring: string
}

/**
 * Reads the Gumroad product URLs from the environment (server-side only —
 * call from Server Components or API routes, then pass down as props).
 * Falls back to '#' so missing env vars degrade to dead links, not crashes.
 */
export function getGumroadUrls(): GumroadUrls {
  return {
    basic:      process.env.GUMROAD_PRODUCT_BASIC      ?? '#',
    premium:    process.env.GUMROAD_PRODUCT_PREMIUM    ?? '#',
    monitoring: process.env.GUMROAD_PRODUCT_MONITORING ?? '#',
  }
}

/**
 * Appends scan_id to a Gumroad checkout URL. Gumroad echoes checkout URL
 * params back in the webhook payload (url_params), which is how the webhook
 * links the purchase to the scan. Handles URLs that already carry a query
 * string. Client-safe (no env access).
 */
export function withScanId(gumroadUrl: string, scanId: string): string {
  const sep = gumroadUrl.includes('?') ? '&' : '?'
  return `${gumroadUrl}${sep}scan_id=${encodeURIComponent(scanId)}`
}

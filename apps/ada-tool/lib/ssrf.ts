// SSRF protection for the public scan endpoint. The scanner drives a real
// headless browser, so a malicious URL could otherwise probe internal services
// or cloud metadata endpoints. Defense: resolve the hostname up front and
// refuse anything that lands in a private, loopback, link-local, or otherwise
// reserved range — then re-check the final URL after redirects.

import { lookup } from 'dns/promises'
import { isIP } from 'net'

/** Thrown when a URL fails SSRF validation. Message is safe to show users. */
export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlockedUrlError'
  }
}

// ─── IPv4 ─────────────────────────────────────────────────────────────────────

/** Returns true when the dotted-quad IPv4 address is private or reserved. */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true
  const [a, b] = parts as [number, number, number, number]
  return (
    a === 0 ||                          // 0.0.0.0/8 — "this network"
    a === 10 ||                         // 10.0.0.0/8 — private
    a === 127 ||                        // 127.0.0.0/8 — loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 — CGNAT
    (a === 169 && b === 254) ||         // 169.254.0.0/16 — link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 — private
    (a === 192 && b === 0) ||           // 192.0.0.0/24 + 192.0.2.0/24 — reserved/test
    (a === 192 && b === 168) ||         // 192.168.0.0/16 — private
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 — benchmarking
    a >= 224                            // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
  )
}

// ─── IPv6 ─────────────────────────────────────────────────────────────────────

/** Returns true when the IPv6 address is private, loopback, or reserved. */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  // IPv4-mapped, dotted form (::ffff:1.2.3.4) — validate the embedded IPv4
  const v4 = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (v4) return isPrivateIPv4(v4[1]!)
  // IPv4-mapped, hex form (::ffff:7f00:1 — how the WHATWG URL parser
  // canonicalizes ::ffff:127.0.0.1) — decode the two 16-bit groups
  const v4hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (v4hex) {
    const hi = parseInt(v4hex[1]!, 16)
    const lo = parseInt(v4hex[2]!, 16)
    return isPrivateIPv4(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`)
  }
  return (
    lower === '::' ||
    lower === '::1' ||                   // loopback
    lower.startsWith('fc') ||            // fc00::/7 — unique local
    lower.startsWith('fd') ||
    lower.startsWith('fe8') ||           // fe80::/10 — link-local
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb') ||
    lower.startsWith('ff')               // ff00::/8 — multicast
  )
}

function isPrivateIp(ip: string): boolean {
  const family = isIP(ip)
  if (family === 4) return isPrivateIPv4(ip)
  if (family === 6) return isPrivateIPv6(ip)
  return true // not a recognizable IP — treat as unsafe
}

// ─── Public API ───────────────────────────────────────────────────────────────

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal'])

/**
 * Validates that a URL is safe for the scanner to visit: http(s) only, a
 * public hostname, and every DNS-resolved address in a public range.
 *
 * Best-effort: a DNS-rebinding attacker could still change records between
 * this check and the browser's own resolution, but combined with the
 * post-redirect re-check this blocks all straightforward SSRF vectors.
 *
 * @throws BlockedUrlError with a user-safe message when validation fails.
 */
export async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BlockedUrlError('URL must use http or https')
  }

  // URL.hostname wraps IPv6 literals in brackets — strip for inspection
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new BlockedUrlError('Scanning local or internal addresses is not allowed')
  }

  // IP literal (including exotic encodings): validate directly.
  // Reject all-numeric / hex hostnames that aren't dotted-quad — browsers
  // interpret "2130706433" or "0x7f000001" as IPv4, bypassing string checks.
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new BlockedUrlError('Scanning private or reserved IP addresses is not allowed')
    }
    return
  }
  if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname) || /^[\d.]+$/.test(hostname) || /0x/i.test(hostname)) {
    throw new BlockedUrlError('IP addresses must use standard dotted notation')
  }

  // Domain name: resolve and validate every address it maps to
  let addresses: Array<{ address: string }>
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new BlockedUrlError(`Cannot resolve hostname: ${hostname}`)
  }

  if (addresses.length === 0) {
    throw new BlockedUrlError(`Cannot resolve hostname: ${hostname}`)
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new BlockedUrlError('Scanning hosts that resolve to private addresses is not allowed')
    }
  }
}

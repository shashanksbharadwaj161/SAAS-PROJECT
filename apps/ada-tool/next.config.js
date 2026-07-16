// Content Security Policy. 'unsafe-inline' is required in script-src for
// Next.js hydration inline scripts and in style-src because the app styles
// via inline style attributes (design decision — no CSS-in-JS runtime).
// No external origins are allowed anywhere: all assets are self-hosted and
// checkout links are plain top-level navigations (not governed by CSP).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for puppeteer-core + @sparticuz/chromium-min (native binaries, can't be bundled)
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],

  // Transpile shared monorepo packages (TypeScript source, no build step)
  transpilePackages: ['@saas/ui', '@saas/pdf', '@saas/db'],

  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for puppeteer-core + @sparticuz/chromium-min (native binaries, can't be bundled)
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],

  // Transpile shared monorepo packages (TypeScript source, no build step)
  transpilePackages: ['@saas/ui', '@saas/pdf', '@saas/db', '@saas/stripe'],
}

module.exports = nextConfig

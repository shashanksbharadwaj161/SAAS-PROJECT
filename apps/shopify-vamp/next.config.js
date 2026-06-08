/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile shared monorepo packages (TypeScript source, no build step)
  transpilePackages: ['@saas/ui', '@saas/db'],
}

module.exports = nextConfig

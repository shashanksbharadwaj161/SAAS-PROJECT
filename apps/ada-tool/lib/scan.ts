// axe-core catches ~57% of WCAG issues automatically (Deque Systems, 2,000+ audits, 300K issues).
// Every consumer of this module MUST surface that disclosure to end users.

import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { existsSync, readFileSync } from 'fs'
import { resolve as pathResolve } from 'path'
import { assertPublicUrl, BlockedUrlError } from './ssrf'

// ─── Constants ───────────────────────────────────────────────────────────────

const SCAN_TIMEOUT_MS = 45_000

// Fallback Chromium pack for serverless cold-start download.
// Set CHROMIUM_PACK_URL to override (e.g. for version pinning).
const CHROMIUM_DEFAULT_PACK =
  'https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar'

// ─── axe-core source ─────────────────────────────────────────────────────────

// Read axe-core's browser bundle from disk rather than using axe.source from the
// module import. Next.js/webpack can strip or transform axe.source in production
// builds, leaving it undefined and causing "Cannot read properties of undefined
// (reading 'run')" in the browser context. readFileSync bypasses the bundler.
let _axeSource: string | undefined

function getAxeSource(): string {
  if (_axeSource) return _axeSource
  // axe.min.js is copied into public/ by the "prebuild" npm script before next build.
  // process.cwd() in Next.js production always returns the app root (apps/ada-tool/),
  // making public/ a stable, reliable path regardless of monorepo structure.
  const p = pathResolve(process.cwd(), 'public', 'axe.js')
  _axeSource = readFileSync(p, 'utf-8')
  return _axeSource
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ScanError extends Error {
  constructor(
    public readonly code: 'UNREACHABLE' | 'TIMEOUT' | 'SCAN_FAILED',
    message: string,
  ) {
    super(message)
    this.name = 'ScanError'
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ViolationResult {
  id: string
  description: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  nodes: number
  wcagCriteria: string[]
  help: string
  helpUrl: string
}

export interface ScanResult {
  violations: ViolationResult[]
  incomplete: ViolationResult[]
  passes: number
}

// Shape of a single rule in axe's raw browser output
interface AxeRuleResult {
  id: string
  description: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  tags: string[]
  help: string
  helpUrl: string
  nodes: unknown[]
}

interface AxeRunOutput {
  violations: AxeRuleResult[]
  incomplete: AxeRuleResult[]
  passes: AxeRuleResult[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// System Chromium paths checked in order. CHROME_EXECUTABLE_PATH overrides all.
const SYSTEM_CHROME_PATHS = [
  process.env.CHROME_EXECUTABLE_PATH,
  '/usr/bin/chromium-browser',          // Debian/Ubuntu (Render default)
  '/usr/bin/chromium',                  // Alpine / some Ubuntu configs
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',  // macOS dev
]

function findSystemChrome(): string | null {
  for (const p of SYSTEM_CHROME_PATHS) {
    if (p && existsSync(p)) return p
  }
  return null
}

async function resolveExecutablePath(): Promise<string> {
  const packUrl = process.env.CHROMIUM_PACK_URL ?? CHROMIUM_DEFAULT_PACK

  // ── Render persistent server ───────────────────────────────────────────────
  // Render sets RENDER=true automatically. Prefer system Chromium installed
  // during build (apt-get install -y chromium-browser) — no cold-start download.
  if (process.env.RENDER) {
    const sys = findSystemChrome()
    if (sys) return sys
    // System Chromium not installed — fall back to pack download.
    // Add `apt-get install -y chromium-browser` to render.yaml buildCommand
    // to avoid this path on every server start.
    return chromium.executablePath(packUrl)
  }

  // ── Serverless (Vercel / AWS Lambda) ──────────────────────────────────────
  // Download + extract pack to /tmp on cold start; ephemeral filesystem is fine.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return chromium.executablePath(packUrl)
  }

  // ── Local development ─────────────────────────────────────────────────────
  const sys = findSystemChrome()
  if (sys) return sys

  // Last resort: download pack (works on any writable /tmp)
  return chromium.executablePath(packUrl)
}

function mapRule(r: AxeRuleResult): ViolationResult {
  return {
    id: r.id,
    description: r.description,
    impact: r.impact,
    nodes: r.nodes.length,
    wcagCriteria: r.tags.filter((t) => /^wcag/.test(t)),
    help: r.help,
    helpUrl: r.helpUrl,
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function scanUrl(url: string): Promise<ScanResult> {
  // ── 1. Resolve Chromium path ─────────────────────────────────────────────
  const executablePath = await resolveExecutablePath().catch((err: Error) => {
    throw new ScanError('SCAN_FAILED', `Cannot locate Chromium: ${err.message}`)
  })

  // ── 2. Launch browser ────────────────────────────────────────────────────
  // NOTE: never pass --disable-web-security here — the scanned page is
  // untrusted content and must not be able to read cross-origin responses.
  const browser = await puppeteer
    .launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,          // scan sites with self-signed certs in dev
    })
    .catch((err: Error) => {
      throw new ScanError('SCAN_FAILED', `Browser launch failed: ${err.message}`)
    })

  try {
    // ── 3. Open page and navigate ──────────────────────────────────────────
    const page = await browser.newPage()

    // Block heavy resources — images/media don't affect WCAG semantic checks
    // and cutting them reduces memory pressure in the 1024MB Lambda budget.
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'media', 'font'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Navigation timeout separate from the overall scan budget
    page.setDefaultNavigationTimeout(25_000)

    const response = await page
      .goto(url, { waitUntil: 'load' })
      .catch((err: Error) => {
        const msg = err.message
        if (
          msg.includes('ERR_NAME_NOT_RESOLVED') ||
          msg.includes('ERR_CONNECTION_REFUSED') ||
          msg.includes('ERR_CONNECTION_TIMED_OUT') ||
          msg.includes('net::ERR_')
        ) {
          throw new ScanError('UNREACHABLE', `Cannot reach ${url}`)
        }
        if (/timeout/i.test(msg)) {
          throw new ScanError('TIMEOUT', `Navigation timed out loading ${url}`)
        }
        throw new ScanError('SCAN_FAILED', `Navigation failed: ${msg}`)
      })

    if (!response || !response.ok()) {
      throw new ScanError(
        'UNREACHABLE',
        `HTTP ${response?.status() ?? '???'} from ${url}`,
      )
    }

    // Re-validate after redirects — the initial URL may have been public but
    // redirected the browser to an internal host (SSRF via redirect).
    try {
      await assertPublicUrl(new URL(page.url()))
    } catch (err) {
      if (err instanceof BlockedUrlError) {
        throw new ScanError('UNREACHABLE', 'Site redirected to a blocked address')
      }
      throw err
    }

    // ── 4. Inject axe-core ─────────────────────────────────────────────────
    await page.addScriptTag({ content: getAxeSource() }).catch((err: Error) => {
      throw new ScanError('SCAN_FAILED', `axe injection failed: ${err.message}`)
    })

    // ── 5. Run axe with timeout guard ─────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawAny = await Promise.race<any>([
      page.evaluate(async () =>
        // window.axe is available because we injected the source above.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
        }),
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new ScanError('TIMEOUT', 'axe.run() timed out')),
          SCAN_TIMEOUT_MS - 8_000,  // 37s — leaves 8s for launch + navigation overhead
        ),
      ),
    ]).catch((err: unknown) => {
      if (err instanceof ScanError) throw err
      throw new ScanError(
        'SCAN_FAILED',
        `axe scan error: ${(err as Error).message}`,
      )
    })

    const raw = rawAny as AxeRunOutput

    // ── 6. Map to typed result ─────────────────────────────────────────────
    return {
      violations: raw.violations.map(mapRule),
      incomplete: raw.incomplete.map(mapRule),
      passes: raw.passes.length,
    }
  } finally {
    // Always close — leaked browsers exhaust Lambda memory
    await browser.close().catch(() => {})
  }
}

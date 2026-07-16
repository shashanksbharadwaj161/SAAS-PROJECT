'use client'

import { useState, useRef, useEffect } from 'react'
import {
  SEVERITY,
  severityOf,
  scoreColor,
  scoreGlow,
  scoreLabel,
  type SeverityKey,
  type ImpactLevel,
} from '@/lib/severity'
import { withScanId, type GumroadUrls } from '@/lib/gumroad'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Violation {
  id: string
  description: string
  impact: ImpactLevel
  nodes_affected: number
  wcag_criteria: string[]
}

interface ScanResult {
  scanId: string
  score: number
  violations: Violation[]
  totalViolations?: number
  severityCounts?: { critical: number; serious: number; moderate: number; minor: number }
  incompleteCount: number
  passCount: number
  coverageNote: string
}

interface Props {
  gumroadUrls: GumroadUrls
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

const LOADING_STEPS = [
  'Loading your website',
  'Injecting WCAG scanner',
  'Running 50+ accessibility checks',
  'Calculating accessibility score',
]

// Step advance times (ms from scan start) — tuned to typical scan duration
const STEP_TIMES = [4000, 10000, 22000]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScanWidget({ gumroadUrls }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [url,          setUrl]          = useState('')
  const [loading,      setLoading]      = useState(false)
  const [activeStep,   setActiveStep]   = useState(0)
  const [result,       setResult]       = useState<ScanResult | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const resultsRef                      = useRef<HTMLDivElement>(null)

  // Advance the loading steps on a fixed schedule while scanning
  useEffect(() => {
    if (!loading) {
      setActiveStep(0)
      return
    }
    const timers = STEP_TIMES.map((ms, i) => setTimeout(() => setActiveStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [loading])

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const rawUrl = url.trim()
    if (!rawUrl) { setError('Please enter a website URL.'); return }

    const scanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    if (!isValidUrl(scanUrl)) { setError('Please enter a valid website URL.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: scanUrl, businessName: businessName.trim() || undefined }),
      })

      const data = await res.json() as Record<string, unknown>

      if (!res.ok) {
        const serverMsg = data.error as string | undefined
        if (res.status === 429) {
          setError('Please wait 60 seconds between scans, then try again.')
        } else if (res.status === 422) {
          setError(
            'We couldn’t reach that website. Check the address is correct and the site is online, then try again.',
          )
        } else if (res.status === 504) {
          setError(
            'The site took too long to respond. Large or slow sites can time out — try again in a moment.',
          )
        } else if (res.status === 400) {
          setError(serverMsg ?? 'That doesn’t look like a scannable URL. Check the address and try again.')
        } else {
          setError(serverMsg ?? 'The scan hit an unexpected error. Please try again — it usually works on the second attempt.')
        }
        return
      }

      setResult(data as unknown as ScanResult)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Severity counts: prefer API totals; fall back to counting the shown top 3
  const counts = result?.severityCounts ?? {
    critical: result?.violations.filter(v => v.impact === 'critical').length ?? 0,
    serious:  result?.violations.filter(v => v.impact === 'serious').length ?? 0,
    moderate: result?.violations.filter(v => v.impact === 'moderate').length ?? 0,
    minor:    result?.violations.filter(v => severityOf(v.impact) === 'minor').length ?? 0,
  }
  const totalViolations = result?.totalViolations ?? result?.violations.length ?? 0

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div
      className="scan-card"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(59,130,246,0.08)',
      }}
    >

      {/* ── Phase 2: loading ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '12px 0' }}>
          <div
            aria-hidden="true"
            style={{
              width: '48px',
              height: '48px',
              border: '2px solid var(--border-default)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
            Analyzing accessibility barriers...
          </div>
          <div style={{ maxWidth: '320px', margin: '0 auto' }}>
            {LOADING_STEPS.map((step, i) => {
              const done   = i < activeStep
              const active = i === activeStep
              return (
                <div
                  key={step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '6px 0',
                    fontSize: '14px',
                    color: done ? 'var(--success)' : active ? 'var(--accent-bright)' : 'var(--text-muted)',
                  }}
                >
                  {done ? (
                    <span style={{ width: '8px', textAlign: 'center' }}>✓</span>
                  ) : (
                    <span
                      aria-hidden="true"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: active ? 'var(--accent)' : 'var(--text-muted)',
                        animation: active ? 'pulse 1.2s ease-in-out infinite' : undefined,
                      }}
                    />
                  )}
                  <span>{step}</span>
                </div>
              )
            })}
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            Typically 20–40 seconds. Keep this tab open.
          </div>
        </div>
      ) : (

        /* ── Phase 1: input ─────────────────────────────────────────────── */
        <form onSubmit={handleScan}>
          <input
            type="text"
            className="input-dark"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Business name (optional — appears on your documents)"
            aria-label="Business name (optional — appears on your documents)"
            maxLength={200}
            style={{ ...inputStyle, marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-dark"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              aria-label="Website URL to scan"
              maxLength={2048}
              style={{ ...inputStyle, flex: '1 1 240px', width: 'auto', fontSize: '16px' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Scan My Site Free
            </button>
          </div>
        </form>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: 'var(--critical-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Phase 3: results ─────────────────────────────────────────────── */}
      {result && !loading && (
        // scrollMarginTop keeps the score visible below the fixed notice bar +
        // sticky nav (32px + 64px) when scrollIntoView aligns this block
        <div ref={resultsRef} style={{ marginTop: '24px', scrollMarginTop: '110px' }}>

          {/* Score */}
          <div
            style={{
              textAlign: 'center',
              paddingBottom: '24px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '24px',
            }}
          >
            <div style={{ lineHeight: 1 }}>
              <span
                style={{
                  fontSize: '88px',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  color: scoreColor(result.score),
                  textShadow: scoreGlow(result.score),
                }}
              >
                {result.score}
              </span>
              <span
                style={{
                  fontSize: '32px',
                  color: 'var(--text-muted)',
                  verticalAlign: 'top',
                  display: 'inline-block',
                  marginTop: '16px',
                  marginLeft: '4px',
                  fontWeight: 700,
                }}
              >
                /100
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: scoreColor(result.score) }}>
              {scoreLabel(result.score)}
            </div>
            <a
              href={`/results/${result.scanId}`}
              className="btn-outline"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                border: '1px solid var(--border-strong)',
                background: 'transparent',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              View &amp; share full report →
            </a>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Permanent link — share it with your attorney or developer.
            </div>
          </div>

          {/* Severity stat boxes */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {(Object.keys(SEVERITY) as SeverityKey[]).map(key => (
              <div
                key={key}
                style={{
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  flex: '1 1 100px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 800, color: SEVERITY[key].color }}>
                  {counts[key]}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  {key}
                </div>
              </div>
            ))}
          </div>

          {/* Violations */}
          {result.violations.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Top Issues Found</span>
                <span
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent-bright)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {result.violations.length} of {totalViolations}
                </span>
              </div>

              {result.violations.map(v => {
                const sev = severityOf(v.impact)
                return (
                  <div
                    key={v.id}
                    style={{
                      background: 'var(--bg-overlay)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      borderLeft: `3px solid ${SEVERITY[sev].color}`,
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: SEVERITY[sev].dim,
                          color: SEVERITY[sev].color,
                        }}
                      >
                        {sev}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {v.nodes_affected} element{v.nodes_affected !== 1 ? 's' : ''} affected
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, margin: '8px 0 4px', lineHeight: 1.4 }}>
                      {v.description}
                    </div>
                    {v.wcag_criteria.length > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {v.wcag_criteria.join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Coverage note */}
          <div
            style={{
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginTop: '16px',
              fontSize: '13px',
              color: '#fde68a',
              lineHeight: 1.5,
            }}
          >
            {result.coverageNote} {result.passCount} checks passed · {result.incompleteCount} require manual review.
          </div>

          {/* Pricing */}
          <div
            id="pricing"
            style={{
              marginTop: '24px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '24px',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
              Get Your Full Evidence Package
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Showing {result.violations.length} of {totalViolations} detected issues
            </div>

            <div className="grid-tiers">
              {[
                {
                  name: 'Basic',
                  price: '$49',
                  sub: 'one-time purchase',
                  features: ['Evidence Package PDF', 'All violations documented', 'Executive summary', 'Plain-English explanations'],
                  href: withScanId(gumroadUrls.basic, result.scanId),
                  featured: false,
                },
                {
                  name: 'Premium',
                  price: '$79',
                  sub: 'one-time purchase',
                  features: ['Everything in Basic', 'Developer Remediation Guide', 'Before/after code examples', 'Fix difficulty ratings'],
                  href: withScanId(gumroadUrls.premium, result.scanId),
                  featured: true,
                },
                {
                  name: 'Monitoring',
                  price: '$149',
                  sub: 'per month',
                  features: ['Everything in Premium', 'Monthly re-scans', 'Monitoring Confirmation doc', 'Ongoing evidence trail'],
                  href: withScanId(gumroadUrls.monitoring, result.scanId),
                  featured: false,
                },
              ].map(tier => (
                <div
                  key={tier.name}
                  className={tier.featured ? undefined : 'tier-card'}
                  style={{
                    background: 'var(--bg-overlay)',
                    border: tier.featured ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    position: 'relative',
                    boxShadow: tier.featured ? 'var(--shadow-accent)' : undefined,
                    marginTop: tier.featured ? 0 : undefined,
                  }}
                >
                  {tier.featured && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 14px',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: '8px',
                    }}
                  >
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {tier.price}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {tier.sub}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 2, marginBottom: '16px' }}>
                    {tier.features.map(f => (
                      <div key={f}>• {f}</div>
                    ))}
                  </div>
                  <a
                    href={tier.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={tier.featured ? 'btn-filled' : 'btn-outline'}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                      ...(tier.featured
                        ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                        : {
                            border: '1px solid var(--border-strong)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                          }),
                    }}
                  >
                    Get {tier.name}
                  </a>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '16px 0 0', textAlign: 'center' }}>
              PDFs delivered by email within minutes. Links valid 7 days.
              This is a technical assessment, not legal advice. Consult a qualified attorney.
            </p>
          </div>

        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Violation {
  id: string
  description: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  nodes_affected: number
  wcag_criteria: string[]
}

interface ScanResult {
  scanId: string
  score: number
  violations: Violation[]
  incompleteCount: number
  passCount: number
  coverageNote: string
}

interface GumroadUrls {
  basic: string
  premium: string
  monitoring: string
}

interface Props {
  gumroadUrls: GumroadUrls
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMPACT_COLOR: Record<string, string> = {
  critical: '#dc2626',
  serious:  '#d97706',
  moderate: '#ca8a04',
  minor:    '#6b7280',
}

const IMPACT_BG: Record<string, string> = {
  critical: '#fef2f2',
  serious:  '#fffbeb',
  moderate: '#fefce8',
  minor:    '#f9fafb',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Good'
  if (score >= 50) return 'Needs Work'
  return 'Critical Issues'
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScanWidget({ gumroadUrls }: Props) {
  const [url,       setUrl]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<ScanResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const resultsRef                = useRef<HTMLDivElement>(null)

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
        body:    JSON.stringify({ url: scanUrl }),
      })

      const data = await res.json() as Record<string, unknown>

      if (!res.ok) {
        if (res.status === 429) {
          setError('Please wait 60 seconds between scans.')
        } else {
          setError((data.error as string | undefined) ?? 'Scan failed. Please try again.')
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

  return (
    <div>
      {/* ── Scan form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleScan} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://yourbusiness.com"
          disabled={loading}
          aria-label="Website URL to scan"
          style={{
            flex:         '1 1 260px',
            padding:      '12px 16px',
            fontSize:     '16px',
            border:       '2px solid #d1d5db',
            borderRadius: '6px',
            outline:      'none',
            background:   loading ? '#f3f4f6' : '#fff',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding:       '12px 28px',
            fontSize:      '16px',
            fontWeight:    '700',
            background:    loading ? '#93c5fd' : '#1d4ed8',
            color:         '#fff',
            border:        'none',
            borderRadius:  '6px',
            cursor:        loading ? 'not-allowed' : 'pointer',
            whiteSpace:    'nowrap',
          }}
        >
          {loading ? 'Scanning…' : 'Scan My Site Free'}
        </button>
      </form>

      {loading && (
        <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
          Running WCAG scan — this can take up to 30 seconds…
        </p>
      )}

      {error && (
        <div role="alert" style={{
          marginTop:    '12px',
          padding:      '12px 16px',
          background:   '#fef2f2',
          border:       '1px solid #fca5a5',
          borderRadius: '6px',
          color:        '#991b1b',
          fontSize:     '14px',
        }}>
          {error}
        </div>
      )}

      {/* ── Scan results ─────────────────────────────────────────────────────── */}
      {result && (
        <div ref={resultsRef} style={{ marginTop: '32px' }}>

          {/* Score card */}
          <div style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '24px',
            padding:       '24px',
            background:    '#f9fafb',
            border:        '1px solid #e5e7eb',
            borderRadius:  '8px',
            marginBottom:  '24px',
            flexWrap:      'wrap',
          }}>
            <div style={{ textAlign: 'center', minWidth: '80px' }}>
              <div style={{
                fontSize:   '52px',
                fontWeight: '800',
                color:      scoreColor(result.score),
                lineHeight: '1',
              }}>
                {result.score}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>out of 100</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize:     '18px',
                fontWeight:   '700',
                color:        scoreColor(result.score),
                marginBottom: '6px',
              }}>
                {scoreLabel(result.score)}
              </div>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                {result.violations.length === 0
                  ? 'No critical violations detected in automated scan.'
                  : `${result.violations.length} violation type${result.violations.length > 1 ? 's' : ''} detected (showing top 3 free).`}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {result.passCount} checks passed &nbsp;·&nbsp;
                {result.incompleteCount} require manual review
              </div>
            </div>
          </div>

          {/* Top 3 violations */}
          {result.violations.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
                Top Issues Found (free preview — 3 of {result.violations.length})
              </h3>
              {result.violations.map((v) => (
                <div key={v.id} style={{
                  padding:       '14px 16px',
                  marginBottom:  '10px',
                  background:    IMPACT_BG[v.impact ?? 'minor'],
                  border:        `1px solid ${IMPACT_COLOR[v.impact ?? 'minor']}33`,
                  borderLeft:    `4px solid ${IMPACT_COLOR[v.impact ?? 'minor']}`,
                  borderRadius:  '6px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{
                      fontSize:     '13px',
                      fontWeight:   '700',
                      color:        IMPACT_COLOR[v.impact ?? 'minor'],
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {v.impact ?? 'minor'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {v.nodes_affected} element{v.nodes_affected !== 1 ? 's' : ''} affected
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937', marginTop: '6px' }}>
                    {v.description}
                  </div>
                  {v.wcag_criteria.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      WCAG: {v.wcag_criteria.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Coverage note */}
          <div style={{
            padding:      '12px 16px',
            background:   '#fffbeb',
            border:       '1px solid #fde68a',
            borderRadius: '6px',
            fontSize:     '13px',
            color:        '#92400e',
            marginBottom: '32px',
          }}>
            <strong>Coverage Note:</strong> {result.coverageNote}
          </div>

          {/* Paywall / pricing */}
          <div id="pricing" style={{
            padding:      '32px',
            background:   '#1e293b',
            borderRadius: '12px',
            color:        '#fff',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>
              Get Your Full WCAG Technical Evidence Package
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px' }}>
              Showing 3 of {result.violations.length > 3 ? result.violations.length : 'all'} detected issues.
              Your full package includes every violation, remediation code, and legal-ready documentation.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

              {/* Basic */}
              <div style={{
                flex:         '1 1 180px',
                padding:      '20px',
                background:   '#334155',
                borderRadius: '8px',
                border:       '1px solid #475569',
              }}>
                <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>$49</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                  Basic
                </div>
                <ul style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', paddingLeft: '18px' }}>
                  <li>WCAG Evidence Package PDF</li>
                  <li>All violations listed</li>
                  <li>Executive summary</li>
                </ul>
                <a
                  href={`${gumroadUrls.basic}?scan_id=${result.scanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:       'block',
                    textAlign:     'center',
                    padding:       '10px',
                    background:    '#3b82f6',
                    color:         '#fff',
                    textDecoration: 'none',
                    borderRadius:  '6px',
                    fontSize:      '14px',
                    fontWeight:    '700',
                  }}
                >
                  Get Basic
                </a>
              </div>

              {/* Premium */}
              <div style={{
                flex:         '1 1 180px',
                padding:      '20px',
                background:   '#1d4ed8',
                borderRadius: '8px',
                border:       '2px solid #60a5fa',
                position:     'relative',
              }}>
                <div style={{
                  position:     'absolute',
                  top:          '-10px',
                  left:         '50%',
                  transform:    'translateX(-50%)',
                  background:   '#f59e0b',
                  color:        '#000',
                  fontSize:     '11px',
                  fontWeight:   '700',
                  padding:      '2px 10px',
                  borderRadius: '20px',
                }}>
                  MOST POPULAR
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>$79</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#bfdbfe', marginBottom: '12px' }}>
                  Premium
                </div>
                <ul style={{ fontSize: '13px', color: '#93c5fd', margin: '0 0 16px', paddingLeft: '18px' }}>
                  <li>Everything in Basic</li>
                  <li>Developer Remediation Guide</li>
                  <li>Before/After code examples</li>
                </ul>
                <a
                  href={`${gumroadUrls.premium}?scan_id=${result.scanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:       'block',
                    textAlign:     'center',
                    padding:       '10px',
                    background:    '#fff',
                    color:         '#1d4ed8',
                    textDecoration: 'none',
                    borderRadius:  '6px',
                    fontSize:      '14px',
                    fontWeight:    '700',
                  }}
                >
                  Get Premium
                </a>
              </div>

              {/* Monitoring */}
              <div style={{
                flex:         '1 1 180px',
                padding:      '20px',
                background:   '#334155',
                borderRadius: '8px',
                border:       '1px solid #475569',
              }}>
                <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>$149<span style={{ fontSize: '14px', fontWeight: '400' }}>/mo</span></div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                  Monitoring
                </div>
                <ul style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', paddingLeft: '18px' }}>
                  <li>Everything in Premium</li>
                  <li>Monthly re-scans</li>
                  <li>Monitoring Confirmation doc</li>
                </ul>
                <a
                  href={`${gumroadUrls.monitoring}?scan_id=${result.scanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:       'block',
                    textAlign:     'center',
                    padding:       '10px',
                    background:    '#3b82f6',
                    color:         '#fff',
                    textDecoration: 'none',
                    borderRadius:  '6px',
                    fontSize:      '14px',
                    fontWeight:    '700',
                  }}
                >
                  Get Monitoring
                </a>
              </div>

            </div>

            <p style={{ fontSize: '11px', color: '#64748b', margin: '20px 0 0', textAlign: 'center' }}>
              PDFs delivered by email within minutes. Links valid 7 days.
              This is a technical assessment, not legal advice. Consult a qualified attorney.
            </p>
          </div>

        </div>
      )}
    </div>
  )
}

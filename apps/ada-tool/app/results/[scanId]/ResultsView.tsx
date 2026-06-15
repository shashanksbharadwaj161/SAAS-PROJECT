'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResultViolation {
  id: string
  description: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  nodes_affected: number
  wcag_criteria: string[]
}

export interface PdfDownload {
  label: string
  url: string
}

export interface ResultsViewProps {
  url: string
  businessName: string | null
  score: number
  scanDateLabel: string
  violations: ResultViolation[]
  passCount: number
  incompleteCount: number
  // null = no purchase found for this scan
  purchase: { tier: string; downloads: PdfDownload[] } | null
  // Checkout links with scan_id already appended
  checkout: { basic: string; premium: string; monitoring: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY = {
  critical: { color: 'var(--critical)', dim: 'var(--critical-dim)' },
  serious:  { color: 'var(--serious)',  dim: 'var(--serious-dim)' },
  moderate: { color: 'var(--moderate)', dim: 'var(--moderate-dim)' },
  minor:    { color: 'var(--minor)',    dim: 'var(--minor-dim)' },
} as const

type SeverityKey = keyof typeof SEVERITY
type Filter = 'all' | SeverityKey

function severityOf(impact: ResultViolation['impact']): SeverityKey {
  return impact && impact in SEVERITY ? (impact as SeverityKey) : 'minor'
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--warning)'
  return 'var(--danger)'
}

function scoreGlow(score: number): string {
  if (score >= 80) return '0 0 40px rgba(63,185,80,0.4)'
  if (score >= 60) return '0 0 40px rgba(210,153,34,0.4)'
  return '0 0 40px rgba(248,81,73,0.4)'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Good Standing'
  if (score >= 60) return 'Needs Work'
  return 'Critical Risk'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultsView(props: ResultsViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState(false)

  const counts: Record<SeverityKey, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const v of props.violations) counts[severityOf(v.impact)]++

  const filtered = filter === 'all'
    ? props.violations
    : props.violations.filter(v => severityOf(v.impact) === filter)

  const tabs: Array<{ key: Filter; label: string; n: number }> = [
    { key: 'all',      label: 'All',      n: props.violations.length },
    { key: 'critical', label: 'Critical', n: counts.critical },
    { key: 'serious',  label: 'Serious',  n: counts.serious },
    { key: 'moderate', label: 'Moderate', n: counts.moderate },
    { key: 'minor',    label: 'Minor',    n: counts.minor },
  ]

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — no-op; the URL is visible in the address bar
    }
  }

  return (
    <main style={{ maxWidth: '880px', margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <a href="/" style={{ fontSize: '13px', color: 'var(--text-link)', textDecoration: 'none' }}>
          ← ADA Evidence Tool
        </a>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '16px 0 8px' }}>
          {props.businessName ?? 'Accessibility Scan Results'}
        </h1>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {props.url} · Scanned {props.scanDateLabel}
        </div>
      </div>

      {/* ── Score ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(59,130,246,0.08)',
        }}
      >
        <div
          style={{
            width: '160px',
            height: '160px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            border: `4px solid ${scoreColor(props.score)}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: scoreGlow(props.score),
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.05em', color: scoreColor(props.score), lineHeight: 1 }}>
            {props.score}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 700 }}>/100</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: scoreColor(props.score) }}>
          {scoreLabel(props.score)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
          {props.violations.length} violation type{props.violations.length !== 1 ? 's' : ''} ·{' '}
          {props.passCount} checks passed · {props.incompleteCount} require manual review
        </div>
      </div>

      {/* ── Downloads / purchase ────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: props.purchase ? '1px solid var(--accent)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: props.purchase ? 'var(--shadow-accent)' : undefined,
        }}
      >
        {props.purchase ? (
          <>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
              Your Documents
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {props.purchase.tier.charAt(0).toUpperCase() + props.purchase.tier.slice(1)} package ·
              download links valid 7 days from purchase
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {props.purchase.downloads.map(d => (
                <a
                  key={d.label}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-filled"
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 20px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  ↓ {d.label}
                </a>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
              Purchase required
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              No purchase is linked to this scan yet. Buy a package to receive the full PDF
              evidence documents by email — they will also appear here.
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={props.checkout.basic}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{
                  border: '1px solid var(--border-strong)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Basic — $49
              </a>
              <a
                href={props.checkout.premium}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-filled"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Premium — $79
              </a>
              <a
                href={props.checkout.monitoring}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{
                  border: '1px solid var(--border-strong)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Monitoring — $149/mo
              </a>
            </div>
          </>
        )}
      </div>

      {/* ── Violations + filter tabs ────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
          All Violations
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {tabs.map(tab => {
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                className="filter-tab"
                onClick={() => setFilter(tab.key)}
                style={{
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                  color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {tab.label} ({tab.n})
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}
          >
            {props.violations.length === 0
              ? 'No violations detected in the automated scan. Manual testing is still recommended.'
              : 'No violations at this severity.'}
          </div>
        ) : (
          filtered.map(v => {
            const sev = severityOf(v.impact)
            return (
              <div
                key={v.id}
                style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  borderLeft: `3px solid ${SEVERITY[sev].color}`,
                  border: '1px solid var(--border-subtle)',
                  borderLeftWidth: '3px',
                  borderLeftColor: SEVERITY[sev].color,
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
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {v.id}{v.wcag_criteria.length > 0 ? ` · ${v.wcag_criteria.join(', ')}` : ''}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Share + rescan ──────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
            Share with your attorney
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            This page link shows the full scan results — send it alongside your PDF documents.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={copyLink}
            className="btn-outline"
            style={{
              border: '1px solid var(--border-strong)',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
          <a
            href="/"
            className="btn-filled"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Rescan site
          </a>
        </div>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '32px', lineHeight: 1.7 }}>
        Not legal advice. Technical assessment only — automated scanning detects ~57% of WCAG 2.2
        issues. Consult a qualified attorney.
      </p>

    </main>
  )
}

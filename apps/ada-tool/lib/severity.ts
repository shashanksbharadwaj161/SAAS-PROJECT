// Client-safe severity + score presentation helpers shared by ScanWidget and
// ResultsView. No server-only imports allowed in this module.

/** axe-core impact levels; null means axe did not assign one. */
export type ImpactLevel = 'critical' | 'serious' | 'moderate' | 'minor' | null

/** CSS variable pairs for each severity level (solid + 12% dim background). */
export const SEVERITY = {
  critical: { color: 'var(--critical)', dim: 'var(--critical-dim)' },
  serious:  { color: 'var(--serious)',  dim: 'var(--serious-dim)' },
  moderate: { color: 'var(--moderate)', dim: 'var(--moderate-dim)' },
  minor:    { color: 'var(--minor)',    dim: 'var(--minor-dim)' },
} as const

export type SeverityKey = keyof typeof SEVERITY

/** Normalizes an axe impact value to a severity key (null → 'minor'). */
export function severityOf(impact: ImpactLevel): SeverityKey {
  return impact && impact in SEVERITY ? (impact as SeverityKey) : 'minor'
}

/** Score → CSS color variable: green ≥80, amber ≥60, red below. */
export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--warning)'
  return 'var(--danger)'
}

/** Score → glow box-shadow matching scoreColor. */
export function scoreGlow(score: number): string {
  if (score >= 80) return '0 0 40px rgba(63,185,80,0.4)'
  if (score >= 60) return '0 0 40px rgba(210,153,34,0.4)'
  return '0 0 40px rgba(248,81,73,0.4)'
}

/** Score → short standing label shown beside the score. */
export function scoreLabel(score: number): string {
  if (score >= 80) return 'Good Standing'
  if (score >= 60) return 'Needs Work'
  return 'Critical Risk'
}

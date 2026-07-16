import type { ViolationResult } from './scan'

export interface ViolationSummary {
  id: string
  description: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  nodes_affected: number
  wcag_criteria: string[]
}

const IMPACT_DEDUCTION: Record<string, number> = {
  critical: 20,
  serious:  10,
  moderate:  5,
  minor:     2,
}

/**
 * Accessibility score from 100, deducting per violation by impact:
 * critical −20, serious −10, moderate −5, minor/unknown −2. Floor of 0.
 */
export function calculateScore(violations: ViolationResult[]): number {
  const deduction = violations.reduce((total, v) => {
    return total + (IMPACT_DEDUCTION[v.impact ?? ''] ?? 2)
  }, 0)
  return Math.max(0, 100 - deduction)
}

/** Maps a raw scan violation to the snake_case shape used by the API and PDFs. */
export function toViolationSummary(v: ViolationResult): ViolationSummary {
  return {
    id:            v.id,
    description:   v.description,
    impact:        v.impact,
    nodes_affected: v.nodes,
    wcag_criteria: v.wcagCriteria,
  }
}

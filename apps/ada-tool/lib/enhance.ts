// Best-effort enrichment of scan violations via Claude Haiku. Failures are
// swallowed by design — PDF generation must never block on this step.

import Anthropic from '@anthropic-ai/sdk'
import type { ViolationSummary } from './score'

export interface EnhancedViolation {
  originalId:      string
  plainEnglish:    string
  businessImpact:  string
  fixDifficulty:   'Easy' | 'Medium' | 'Hard'
  estimatedTime:   string
}

const MODEL          = 'claude-haiku-4-5-20251001'
const MAX_VIOLATIONS = 10
const DIFFICULTIES   = new Set(['Easy', 'Medium', 'Hard'])

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

/**
 * Pulls a JSON array out of a model response that may be wrapped in markdown
 * code fences or surrounded by prose. Returns null when no array is found.
 */
function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf('[')
  const end   = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as unknown
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Validates one model-produced item into a well-formed EnhancedViolation. */
function toEnhanced(item: unknown): EnhancedViolation | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  if (
    typeof o.originalId !== 'string' ||
    typeof o.plainEnglish !== 'string' ||
    typeof o.businessImpact !== 'string'
  ) {
    return null
  }
  const difficulty = typeof o.fixDifficulty === 'string' && DIFFICULTIES.has(o.fixDifficulty)
    ? (o.fixDifficulty as EnhancedViolation['fixDifficulty'])
    : 'Medium'
  return {
    originalId:     o.originalId,
    plainEnglish:   o.plainEnglish.slice(0, 500),
    businessImpact: o.businessImpact.slice(0, 500),
    fixDifficulty:  difficulty,
    estimatedTime:  typeof o.estimatedTime === 'string' ? o.estimatedTime.slice(0, 60) : 'Varies',
  }
}

/**
 * Translates WCAG violations into plain-English descriptions, business impact
 * notes, and fix-difficulty estimates for the PDF documents.
 *
 * Best-effort: returns [] when ANTHROPIC_API_KEY is unset, the API call fails,
 * or the response cannot be parsed. Never throws.
 */
export async function enhanceViolations(
  violations: ViolationSummary[],
  siteUrl: string,
): Promise<EnhancedViolation[]> {
  if (violations.length === 0 || !process.env.ANTHROPIC_API_KEY) return []

  const subset = violations.slice(0, MAX_VIOLATIONS).map((v) => ({
    id:          v.id,
    description: v.description,
    impact:      v.impact,
    nodes:       v.nodes_affected,
    wcag:        v.wcag_criteria,
  }))

  const prompt =
    `You are helping a small business owner respond to an ADA demand letter. ` +
    `Translate these WCAG violations into plain English they can understand and show their attorney.\n\n` +
    `Site: ${siteUrl}\n` +
    `Violations: ${JSON.stringify(subset)}\n\n` +
    `For each violation return an object with:\n` +
    `- originalId: the violation id, copied exactly\n` +
    `- plainEnglish: 1-2 sentences, no jargon, explain what's wrong and who it affects\n` +
    `- businessImpact: why this matters for the ADA demand letter (1 sentence)\n` +
    `- fixDifficulty: exactly one of "Easy", "Medium", or "Hard"\n` +
    `- estimatedTime: e.g. "30 minutes", "2-4 hours"\n\n` +
    `Never claim anything makes the site "ADA compliant" or legally protected.\n` +
    `Return ONLY a raw JSON array of these objects. No markdown fences, no other text.`

  try {
    const response = await getClient().messages.create({
      model:      MODEL,
      max_tokens: 4000,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const items = extractJsonArray(text) ?? []

    const knownIds = new Set(subset.map((v) => v.id))
    return items
      .map(toEnhanced)
      .filter((e): e is EnhancedViolation => e !== null && knownIds.has(e.originalId))
  } catch (err) {
    console.warn('enhanceViolations failed (continuing without enhancement):', (err as Error).message)
    return []
  }
}

import Anthropic from '@anthropic-ai/sdk'
import type { ViolationSummary } from './score'

export interface EnhancedViolation {
  originalId:      string
  plainEnglish:    string
  businessImpact:  string
  fixDifficulty:   'Easy' | 'Medium' | 'Hard'
  estimatedTime:   string
}

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export async function enhanceViolations(
  violations: ViolationSummary[],
  siteUrl: string,
): Promise<EnhancedViolation[]> {
  if (violations.length === 0 || !process.env.ANTHROPIC_API_KEY) return []

  const prompt =
    `You are helping a small business owner respond to an ADA demand letter. ` +
    `Translate these WCAG violations into plain English they can understand and show their attorney.\n\n` +
    `Site: ${siteUrl}\n` +
    `Violations: ${JSON.stringify(violations.slice(0, 10))}\n\n` +
    `For each violation return a JSON array with:\n` +
    `- originalId: the violation id\n` +
    `- plainEnglish: 1-2 sentences, no jargon, explain what's wrong and who it affects\n` +
    `- businessImpact: why this matters for the ADA demand letter (1 sentence)\n` +
    `- fixDifficulty: Easy/Medium/Hard\n` +
    `- estimatedTime: e.g. "30 minutes", "2-4 hours"\n\n` +
    `Return ONLY a JSON array. No other text.`

  try {
    const response = await getClient().messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '[]'

    return JSON.parse(text) as EnhancedViolation[]
  } catch {
    // Enhancement is best-effort — never block PDF generation
    return []
  }
}

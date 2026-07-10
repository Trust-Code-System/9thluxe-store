// integrations/ai/mock.ts
// Deterministic, offline AI provider. Default in dev/test. Produces valid JSON for the structured
// tasks so the whole pipeline is exercisable without any API key or network.
import type { AiProvider, AiCallOptions } from './types'

function heuristicIntent(message: string): Record<string, unknown> {
  const m = message.toLowerCase()
  const budget = m.match(/(\d[\d,]{2,})/)?.[1]?.replace(/,/g, '')
  const excludeNotes: string[] = []
  const includeNotes: string[] = []
  for (const note of ['oud', 'vanilla', 'rose', 'citrus', 'musk', 'amber', 'jasmine', 'sandalwood']) {
    if (m.includes(`no ${note}`) || m.includes(`without ${note}`)) excludeNotes.push(note)
    else if (m.includes(note)) includeNotes.push(note)
  }
  let intent = 'recommend'
  if (m.includes('gift')) intent = 'gift'
  else if (m.includes('compare')) intent = 'compare'
  else if (m.includes('layer')) intent = 'layering'
  else if (m.includes('similar') || m.includes('like ')) intent = 'similar'
  else if (m.includes('sample')) intent = 'sample_first'
  return {
    intent,
    budgetMaxNGN: budget ? Number(budget) : null,
    includeNotes,
    excludeNotes,
    occasion: m.includes('wedding') ? 'wedding' : m.includes('office') ? 'office' : null,
    climate: m.includes('hot') || m.includes('summer') ? 'hot' : m.includes('cold') ? 'cold' : null,
  }
}

export const mockAiProvider: AiProvider = {
  name: 'mock',
  model: 'mock-deterministic-1',
  async complete(system: string, user: string, opts: AiCallOptions) {
    const start = Date.now()
    let text: string
    switch (opts.task) {
      case 'classify_intent':
        text = JSON.stringify(heuristicIntent(user))
        break
      case 'explain_recommendation':
        text = JSON.stringify({
          explanation:
            'These fragrances match your requested notes and stay within your stated preferences.',
        })
        break
      case 'answer_support':
        text = JSON.stringify({
          answer: 'Here is what our catalogue and policies indicate.',
          escalate: /refund|complaint|damaged|wrong/i.test(user),
        })
        break
      case 'summarize_reviews': {
        const count = (user.match(/"rating"/g) || []).length
        text = JSON.stringify({
          summary: 'Customers generally praise longevity and projection, with some noting price.',
          reviewsSummarized: count,
          isAiSummary: true,
        })
        break
      }
      case 'draft_marketing':
        text = JSON.stringify({ draft: 'Discover our latest fragrance. Crafted for lasting impression.' })
        break
      case 'layering_tip':
        text = JSON.stringify({ tip: 'Layer the heavier scent first, then a light veil of the second — go easy and test on one wrist.' })
        break
      case 'owner_brief':
        text = JSON.stringify({
          summary: 'Revenue steady; watch low-stock items.',
          actions: ['Reorder low-stock bestsellers', 'Follow up on abandoned carts'],
        })
        break
      default:
        text = JSON.stringify({ note: 'mock', task: opts.task })
    }
    return { text, usage: { provider: 'mock', model: this.model, latencyMs: Date.now() - start } }
  },
}

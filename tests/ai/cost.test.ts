import { describe, it, expect, beforeEach } from 'vitest'
import { recordAiUsage, aiUsageSnapshot, __resetAiUsage, PROMPT_VERSIONS } from '@/integrations/ai/cost'

describe('AI cost tracker', () => {
  beforeEach(() => __resetAiUsage())

  it('aggregates calls and tokens per task/provider/model/prompt', () => {
    recordAiUsage({ task: 'classify_intent', provider: 'mock', model: 'm1', promptVersion: 'v1', inputTokens: 10, outputTokens: 5 })
    recordAiUsage({ task: 'classify_intent', provider: 'mock', model: 'm1', promptVersion: 'v1', inputTokens: 20, outputTokens: 7 })
    const snap = aiUsageSnapshot()
    expect(snap.records).toHaveLength(1)
    expect(snap.records[0].calls).toBe(2)
    expect(snap.totals.inputTokens).toBe(30)
    expect(snap.totals.outputTokens).toBe(12)
  })

  it('exposes a prompt-version registry for every task', () => {
    expect(PROMPT_VERSIONS.classify_intent).toBe('v1')
    expect(Object.keys(PROMPT_VERSIONS).length).toBeGreaterThan(0)
  })
})

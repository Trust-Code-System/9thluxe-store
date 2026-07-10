// integrations/ai/cost.ts
// Lightweight in-process AI usage/cost aggregator + prompt-version registry. Records every AI call's
// task, provider, model, prompt version and token usage so the Owner Copilot can surface an AI cost
// report. NOTE: this is per-process (serverless-instance scoped); durable cross-instance cost
// accounting is documented as a follow-up (persist to a table) in docs/AI_ARCHITECTURE.md.

export interface UsageRecord {
  task: string
  provider: string
  model: string
  promptVersion: string
  calls: number
  inputTokens: number
  outputTokens: number
  lastAt: string
}

const usage = new Map<string, UsageRecord>()

export function recordAiUsage(entry: {
  task: string
  provider: string
  model: string
  promptVersion: string
  inputTokens?: number
  outputTokens?: number
}) {
  const key = `${entry.task}:${entry.provider}:${entry.model}:${entry.promptVersion}`
  const existing = usage.get(key)
  if (existing) {
    existing.calls += 1
    existing.inputTokens += entry.inputTokens ?? 0
    existing.outputTokens += entry.outputTokens ?? 0
    existing.lastAt = new Date().toISOString()
  } else {
    usage.set(key, {
      task: entry.task,
      provider: entry.provider,
      model: entry.model,
      promptVersion: entry.promptVersion,
      calls: 1,
      inputTokens: entry.inputTokens ?? 0,
      outputTokens: entry.outputTokens ?? 0,
      lastAt: new Date().toISOString(),
    })
  }
}

export function aiUsageSnapshot(): { records: UsageRecord[]; totals: { calls: number; inputTokens: number; outputTokens: number } } {
  const records = [...usage.values()].sort((a, b) => b.calls - a.calls)
  const totals = records.reduce(
    (acc, r) => ({ calls: acc.calls + r.calls, inputTokens: acc.inputTokens + r.inputTokens, outputTokens: acc.outputTokens + r.outputTokens }),
    { calls: 0, inputTokens: 0, outputTokens: 0 },
  )
  return { records, totals }
}

/** Prompt versions per task — the single source of truth surfaced to the admin prompt-version view. */
export const PROMPT_VERSIONS: Record<string, string> = {
  classify_intent: 'v1',
  explain_recommendation: 'v1',
  answer_support: 'v1',
  summarize_reviews: 'v1',
  draft_marketing: 'v1',
  owner_brief: 'v1',
}

export function __resetAiUsage() {
  usage.clear()
}

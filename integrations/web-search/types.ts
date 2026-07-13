import type { ConciergeSource } from "@/lib/concierge/types"

export interface WebResearchProvider {
  search(input: {
    query: string
    system: string
    allowedDomains?: string[]
    blockedDomains?: string[]
    maxSearches?: number
    freshness?: "CURRENT" | "RECENT" | "ANY"
    signal?: AbortSignal
    onDelta?: (delta: string) => void
  }): Promise<{
    answerContext: string
    sources: ConciergeSource[]
    usage: { provider: string; model: string; searches: number; inputTokens: number; outputTokens: number; latencyMs: number; firstTokenLatencyMs?: number }
  }>
}

export const CONCIERGE_PRICING_VERIFIED_AT = "2026-07-12"

type Price = { inputPerMillion: number; outputPerMillion: number; searchPerCall: number }

// Public list prices for the configured default models. Unknown overrides intentionally return zero
// rather than inventing a price. Update this table and its verification date when model IDs change.
export function conciergePrice(provider: string | undefined, model: string | undefined): Price | null {
  const id = `${provider ?? ""}:${model ?? ""}`.toLowerCase()
  if (id.includes("openai:gpt-5.6-terra")) return { inputPerMillion: 2.5, outputPerMillion: 15, searchPerCall: 0.01 }
  if (id.includes("anthropic:claude-haiku-4-5")) return { inputPerMillion: 0.5, outputPerMillion: 2.5, searchPerCall: 0.01 }
  if (id.includes("gemini:gemini-3.5-flash")) return { inputPerMillion: 1.5, outputPerMillion: 9, searchPerCall: 0.014 }
  if (id.includes("xai:grok-4.5")) return { inputPerMillion: 2, outputPerMillion: 6, searchPerCall: 0.005 }
  if (provider === "mock") return { inputPerMillion: 0, outputPerMillion: 0, searchPerCall: 0 }
  return null
}

export function estimateConciergeCostMicros(input: { provider?: string; model?: string; inputTokens: number; outputTokens: number; searchCalls: number }) {
  const price = conciergePrice(input.provider, input.model)
  if (!price) return 0
  return Math.max(0, Math.round(
    input.inputTokens * price.inputPerMillion
      + input.outputTokens * price.outputPerMillion
      + input.searchCalls * price.searchPerCall * 1_000_000,
  ))
}

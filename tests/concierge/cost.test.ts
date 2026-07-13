import { describe, expect, it } from "vitest"
import { conciergePrice, estimateConciergeCostMicros } from "@/lib/concierge/cost"

describe("Concierge cost accounting", () => {
  it("uses the verified default-model rates and includes searches", () => {
    expect(conciergePrice("openai", "gpt-5.6-terra")).toMatchObject({ inputPerMillion: 2.5, outputPerMillion: 15 })
    expect(estimateConciergeCostMicros({ provider: "openai", model: "gpt-5.6-terra", inputTokens: 1_000, outputTokens: 500, searchCalls: 1 })).toBe(20_000)
  })

  it("does not invent a price for an unknown model override", () => {
    expect(estimateConciergeCostMicros({ provider: "openai", model: "custom-model", inputTokens: 1_000, outputTokens: 500, searchCalls: 1 })).toBe(0)
  })
})

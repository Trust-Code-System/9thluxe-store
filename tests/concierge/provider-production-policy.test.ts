import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({ env: {
  OPENAI_API_KEY: undefined, ANTHROPIC_API_KEY: undefined, GEMINI_API_KEY: undefined, XAI_API_KEY: undefined,
  OPENAI_MODEL: "gpt-5.6-terra", ANTHROPIC_MODEL: "claude-haiku-4-5-20251001", GEMINI_MODEL: "gemini-3.5-flash", XAI_MODEL: "grok-4.5",
  AI_PROVIDER_PRIORITY: "openai,anthropic,gemini,xai", AI_DEMO_MODE: false, NODE_ENV: "production",
  CONCIERGE_MAX_OUTPUT_TOKENS: 1400, CONCIERGE_MAX_SEARCH_CALLS: 3,
} }))
vi.mock("@/lib/observability/logger", () => ({ logger: { warn: vi.fn() } }))

import { generateConciergeAnswer } from "@/integrations/ai/router"
import { compatibleProviders } from "@/integrations/ai/capabilities"

describe("Concierge production provider policy", () => {
  it("prohibits silent mock answers when no real provider is configured", async () => {
    expect(compatibleProviders(["CHAT"])).toEqual([])
    await expect(generateConciergeAnswer({ system: "test", messages: [{ role: "user", content: "hello" }] })).rejects.toMatchObject({ code: "AI_UNAVAILABLE" })
  })
})

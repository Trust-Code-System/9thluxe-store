import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({ env: {
  OPENAI_API_KEY: undefined, ANTHROPIC_API_KEY: undefined, GEMINI_API_KEY: undefined, XAI_API_KEY: "test-key",
  OPENAI_MODEL: "gpt-5.6-terra", ANTHROPIC_MODEL: "claude-haiku-4-5-20251001", GEMINI_MODEL: "gemini-3.5-flash", XAI_MODEL: "grok-4.5",
  AI_PROVIDER_PRIORITY: "xai,openai,anthropic,gemini", AI_DEMO_MODE: false, NODE_ENV: "test",
  CONCIERGE_MAX_OUTPUT_TOKENS: 1400, CONCIERGE_MAX_SEARCH_CALLS: 3,
} }))
vi.mock("@/lib/observability/logger", () => ({ logger: { warn: vi.fn() } }))

import { generateConciergeAnswer } from "@/integrations/ai/router"

describe("xAI Concierge V2 adapter", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("uses xAI's Responses-compatible endpoint as a first-class provider", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ output_text: "xAI answer", output: [], usage: { input_tokens: 5, output_tokens: 2 } }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const result = await generateConciergeAnswer({ system: "test", messages: [{ role: "user", content: "hello" }] })
    expect(result).toMatchObject({ provider: "xai", model: "grok-4.5", text: "xAI answer" })
    expect(fetchMock).toHaveBeenCalledWith("https://api.x.ai/v1/responses", expect.anything())
  })
})

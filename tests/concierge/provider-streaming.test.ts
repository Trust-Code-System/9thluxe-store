import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({ env: {
  OPENAI_API_KEY: "test-key", ANTHROPIC_API_KEY: "test-key", GEMINI_API_KEY: undefined, XAI_API_KEY: undefined,
  OPENAI_MODEL: "gpt-5.6-terra", ANTHROPIC_MODEL: "claude-haiku-4-5-20251001", GEMINI_MODEL: "gemini-3.5-flash", XAI_MODEL: "grok-4.5",
  AI_PROVIDER_PRIORITY: "openai,anthropic,gemini,xai", AI_DEMO_MODE: false, NODE_ENV: "test",
  CONCIERGE_MAX_OUTPUT_TOKENS: 1400, CONCIERGE_MAX_SEARCH_CALLS: 3,
} }))
vi.mock("@/lib/observability/logger", () => ({ logger: { warn: vi.fn() } }))

import { generateConciergeAnswer } from "@/integrations/ai/router"

const sse = (events: unknown[]) => new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), { status: 200, headers: { "content-type": "text/event-stream" } })

describe("Concierge provider streaming", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("forwards upstream text deltas before completion", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sse([
      { type: "response.output_text.delta", delta: "Hello " },
      { type: "response.output_text.delta", delta: "world" },
      { type: "response.completed", response: { usage: { input_tokens: 12, output_tokens: 2 }, output: [] } },
    ])))
    const deltas: string[] = []
    const result = await generateConciergeAnswer({ system: "test", messages: [{ role: "user", content: "hello" }], onDelta: (delta) => deltas.push(delta) })
    expect(deltas).toEqual(["Hello ", "world"])
    expect(result.text).toBe("Hello world")
    expect(result.inputTokens).toBe(12)
    expect(result.firstTokenLatencyMs).toBeTypeOf("number")
  })

  it("does not switch providers after customer-visible partial output", async () => {
    const fetchMock = vi.fn(async () => sse([
      { type: "response.output_text.delta", delta: "Partial" },
      { type: "response.failed", response: { error: { code: "failed" } } },
    ]))
    vi.stubGlobal("fetch", fetchMock)
    await expect(generateConciergeAnswer({ system: "test", messages: [{ role: "user", content: "hello" }], onDelta: () => undefined })).rejects.toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("falls back to the next compatible provider before any text is emitted", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("failed", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ content: [{ type: "text", text: "Fallback answer" }], usage: { input_tokens: 4, output_tokens: 2 } }), { status: 200, headers: { "content-type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)
    const result = await generateConciergeAnswer({ system: "test", messages: [{ role: "user", content: "hello" }] })
    expect(result.provider).toBe("anthropic")
    expect(result.text).toBe("Fallback answer")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

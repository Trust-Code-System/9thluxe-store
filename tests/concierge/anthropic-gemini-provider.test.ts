import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({ env: {
  OPENAI_API_KEY: "openai-key", ANTHROPIC_API_KEY: "anthropic-key", GEMINI_API_KEY: "gemini-key", XAI_API_KEY: undefined,
  OPENAI_MODEL: "gpt-test", ANTHROPIC_MODEL: "claude-haiku-4-5-20251001", GEMINI_MODEL: "gemini-test", XAI_MODEL: "grok-test",
  AI_PROVIDER_PRIORITY: "anthropic,gemini,openai,xai", AI_DEMO_MODE: false, NODE_ENV: "test",
  CONCIERGE_MAX_OUTPUT_TOKENS: 1400, CONCIERGE_MAX_SEARCH_CALLS: 3,
} }))
vi.mock("@/lib/observability/logger", () => ({ logger: { warn: vi.fn() } }))

import { generateConciergeAnswer } from "@/integrations/ai/router"

const sse = (events: unknown[]) => new Response(
  events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
  { status: 200, headers: { "content-type": "text/event-stream" } },
)

describe("Anthropic and Gemini concierge providers", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("streams Anthropic deltas and applies web-search limits and allowed domains", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => sse([
      { type: "message_start", message: { usage: { input_tokens: 18 } } },
      { type: "content_block_start", content_block: { type: "server_tool_use", name: "web_search" } },
      { type: "content_block_start", content_block: { type: "web_search_tool_result", content: [
        { url: "https://www.chanel.com/us/fragrance/", title: "Chanel fragrance" },
        { url: "http://insecure.example/story", title: "Unsafe" },
      ] } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Verified " } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "answer" } },
      { type: "message_delta", usage: { output_tokens: 7 } },
    ]))
    vi.stubGlobal("fetch", fetchMock)
    const deltas: string[] = []

    const result = await generateConciergeAnswer({
      system: "Be precise",
      messages: [{ role: "user", content: "Research Chanel" }],
      webResearch: true,
      allowedDomains: ["chanel.com"],
      blockedDomains: ["spam.example"],
      maxSearches: 2,
      onDelta: (delta) => deltas.push(delta),
    })

    expect(result).toMatchObject({
      provider: "anthropic", text: "Verified answer", inputTokens: 18, outputTokens: 7, searchCalls: 1,
    })
    expect(deltas).toEqual(["Verified ", "answer"])
    expect(result.sources).toEqual([expect.objectContaining({ domain: "chanel.com", kind: "official" })])
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(request.tools).toEqual([expect.objectContaining({
      type: "web_search_20250305", name: "web_search", max_uses: 2, allowed_domains: ["chanel.com"],
    })])
    expect(request.tools[0]).not.toHaveProperty("blocked_domains")
  })

  it("collects citations and server search usage from a non-streaming Anthropic response", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      content: [
        { type: "text", text: "One " },
        { type: "text", text: "answer", citations: [
          { url: "https://www.reddit.com/r/fragrance/comments/example", title: "Community thread" },
          { url: "https://127.0.0.1/private", title: "Private" },
        ] },
      ],
      usage: { input_tokens: 9, output_tokens: 3, server_tool_use: { web_search_requests: 2 } },
    }), { status: 200, headers: { "content-type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await generateConciergeAnswer({
      system: "test", messages: [{ role: "user", content: "Research this" }], webResearch: true,
      blockedDomains: ["spam.example"],
    })

    expect(result).toMatchObject({ provider: "anthropic", text: "One answer", inputTokens: 9, outputTokens: 3, searchCalls: 2 })
    expect(result.sources).toEqual([expect.objectContaining({ domain: "reddit.com", kind: "community" })])
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(request.tools[0]).toMatchObject({ blocked_domains: ["spam.example"] })
  })

  it("falls through to Gemini and streams grounded text with deduplicated searches", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("Anthropic unavailable", { status: 503 }))
      .mockResolvedValueOnce(sse([
        { candidates: [{ content: { parts: [{ text: "Grounded " }] }, groundingMetadata: {
          groundingChunks: [{ web: { uri: "https://www.nytimes.com/wirecutter/reviews/perfume/", title: "Perfume guide" } }],
          webSearchQueries: ["perfume guide", "perfume guide"],
        } }], usageMetadata: { promptTokenCount: 14 } },
        { candidates: [{ content: { parts: [{ text: "response" }] }, groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://www.nytimes.com/wirecutter/reviews/perfume/", title: "Duplicate" } },
            { web: { uri: "https://localhost/secret", title: "Unsafe" } },
          ],
          webSearchQueries: ["second query"],
        } }], usageMetadata: { candidatesTokenCount: 5 } },
      ]))
    vi.stubGlobal("fetch", fetchMock)
    const deltas: string[] = []

    const result = await generateConciergeAnswer({
      system: "test", messages: [{ role: "user", content: "Research perfume" }], webResearch: true,
      onDelta: (delta) => deltas.push(delta),
    })

    expect(result).toMatchObject({ provider: "gemini", text: "Grounded response", inputTokens: 14, outputTokens: 5, searchCalls: 2 })
    expect(deltas).toEqual(["Grounded ", "response"])
    expect(result.sources).toEqual([expect.objectContaining({ domain: "nytimes.com", kind: "editorial" })])
    expect(fetchMock.mock.calls[1]?.[0]).toContain(":streamGenerateContent?alt=sse")
    const request = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))
    expect(request.tools).toEqual([{ google_search: {} }])
  })

  it("reads Gemini non-streaming grounding metadata and token usage", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("Anthropic unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{
          content: { parts: [{ text: "Static " }, { text: "grounding" }] },
          groundingMetadata: {
            groundingChunks: [{ web: { uri: "https://www.nih.gov/about-nih/", title: "NIH" } }],
            webSearchQueries: ["first", "first", "second"],
          },
        }],
        usageMetadata: { promptTokenCount: 21, candidatesTokenCount: 4 },
      }), { status: 200, headers: { "content-type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await generateConciergeAnswer({
      system: "test", messages: [{ role: "user", content: "Research materials" }], webResearch: true,
    })

    expect(result).toMatchObject({ provider: "gemini", text: "Static grounding", inputTokens: 21, outputTokens: 4, searchCalls: 2 })
    expect(result.sources).toEqual([expect.objectContaining({ domain: "nih.gov", kind: "technical" })])
    expect(fetchMock.mock.calls[1]?.[0]).toContain(":generateContent")
  })
})

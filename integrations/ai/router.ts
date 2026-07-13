import { AppError } from "@/lib/http/errors"
import { logger } from "@/lib/observability/logger"
import { env } from "@/lib/env"
import type { ConciergeSource } from "@/lib/concierge/types"
import { compatibleProviders, providerDescriptors, type AiCapability, type AiProviderDescriptor } from "./capabilities"

export interface ConciergeGenerationInput {
  system: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  requiredCapabilities?: AiCapability[]
  webResearch?: boolean
  maxOutputTokens?: number
  signal?: AbortSignal
  allowedDomains?: string[]
  blockedDomains?: string[]
  maxSearches?: number
  onDelta?: (delta: string) => void
}

export interface ConciergeGenerationResult {
  text: string
  provider: string
  model: string
  sources: ConciergeSource[]
  inputTokens: number
  outputTokens: number
  searchCalls: number
  latencyMs: number
  firstTokenLatencyMs?: number
}

const breaker = new Map<string, { failures: number; openUntil: number }>()
const FAILURE_THRESHOLD = 3
const OPEN_MS = 45_000

function isOpen(id: string, capability: string) {
  return (breaker.get(`${id}:${capability}`)?.openUntil ?? 0) > Date.now()
}
function failed(id: string, capability: string) {
  const key = `${id}:${capability}`
  const value = breaker.get(key) ?? { failures: 0, openUntil: 0 }
  value.failures += 1
  if (value.failures >= FAILURE_THRESHOLD) { value.failures = 0; value.openUntil = Date.now() + OPEN_MS }
  breaker.set(key, value)
}
function succeeded(id: string, capability: string) { breaker.set(`${id}:${capability}`, { failures: 0, openUntil: 0 }) }

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
    const privateHost = host === "localhost" || host === "0.0.0.0" || host === "::1" || host.endsWith(".localhost")
      || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
      || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
      || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")
    if (url.protocol !== "https:" || url.username || url.password || privateHost) return null
    return url.toString()
  } catch { return null }
}

async function readSse(response: Response, onEvent: (event: string, data: any) => void) {
  if (!response.body) throw new AppError("PROVIDER_ERROR", { internal: "provider stream had no body" })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let eventName = "message"
  let dataLines: string[] = []
  const dispatch = () => {
    if (!dataLines.length) return
    const raw = dataLines.join("\n")
    dataLines = []
    if (raw === "[DONE]") return
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { eventName = "message"; return }
    onEvent(eventName, parsed)
    eventName = "message"
  }
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line) { dispatch(); continue }
      if (line.startsWith("event:")) eventName = line.slice(6).trim()
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart())
    }
  }
  if (buffer.startsWith("data:")) dataLines.push(buffer.slice(5).trimStart())
  dispatch()
}

function sourcesFrom(values: Array<{ url?: unknown; title?: unknown }>): ConciergeSource[] {
  const seen = new Set<string>()
  return values.flatMap((value, index) => {
    const url = safeUrl(value.url)
    if (!url || seen.has(url)) return []
    seen.add(url)
    const domain = new URL(url).hostname.replace(/^www\./, "")
    const kind: ConciergeSource["kind"] = /reddit|fragrantica|basenotes/.test(domain) ? "community"
      : /\.gov$|\.edu$|pubmed|nih\.gov|sciencedirect|springer/.test(domain) ? "technical"
        : /sephora|ulta|notino|luckyscent|harrods|selfridges/.test(domain) ? "retailer"
          : /openai|anthropic|google|x\.ai|chanel|dior|guerlain|hermes|tomford|lelabofragrances|creedboutique|maisonfranciskurkdjian|byredo|diptyque|fredericmalle|jomalone/.test(domain) ? "official"
            : "editorial"
    return [{ id: `src_${index + 1}`, title: typeof value.title === "string" && value.title.trim() ? value.title.slice(0, 180) : domain, url, domain, kind, retrievedAt: new Date().toISOString() }]
  }).slice(0, 12)
}

async function fetchTimed(url: string, init: RequestInit, timeoutMs: number, outer?: AbortSignal) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  outer?.addEventListener("abort", onAbort, { once: true })
  try { return await fetch(url, { ...init, signal: controller.signal }) }
  finally { clearTimeout(timeout); outer?.removeEventListener("abort", onAbort) }
}

async function openAiCompatible(provider: AiProviderDescriptor, input: ConciergeGenerationInput, baseUrl: string, key: string) {
  const body: Record<string, unknown> = {
    model: provider.model, instructions: input.system, input: input.messages,
    max_output_tokens: input.maxOutputTokens ?? provider.maxOutputTokens, store: false, stream: Boolean(input.onDelta),
  }
  if (input.webResearch) {
    const searchTool: Record<string, unknown> = { type: "web_search" }
    if (provider.id === "openai" && input.allowedDomains?.length) searchTool.filters = { allowed_domains: input.allowedDomains }
    body.tools = [searchTool]
    body.tool_choice = "auto"
    body.include = ["web_search_call.action.sources"]
  }
  const response = await fetchTimed(`${baseUrl}/responses`, { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body) }, provider.timeoutMs, input.signal)
  if (!response.ok) throw new AppError("PROVIDER_ERROR", { internal: { provider: provider.id, status: response.status } })
  if (input.onDelta) {
    let text = ""
    let completed: any = null
    const rawSources: Array<{ url?: unknown; title?: unknown }> = []
    await readSse(response, (event, data) => {
      const type = data?.type ?? event
      if (type === "response.output_text.delta" && typeof data.delta === "string") {
        text += data.delta
        input.onDelta?.(data.delta)
      }
      if (type === "response.web_search_call.completed") {
        for (const source of data?.item?.action?.sources ?? data?.action?.sources ?? []) rawSources.push({ url: source.url, title: source.title })
      }
      if (type === "response.completed") completed = data.response
      if (type === "response.failed" || type === "error") throw new AppError("PROVIDER_ERROR", { internal: { provider: provider.id, event: type } })
    })
    const output = Array.isArray(completed?.output) ? completed.output : []
    for (const item of output) for (const source of item?.action?.sources ?? item?.sources ?? []) rawSources.push({ url: source.url, title: source.title })
    for (const url of completed?.citations ?? []) rawSources.push({ url, title: undefined })
    if (!text.trim()) throw new AppError("AI_OUTPUT_INVALID")
    return { text, sources: sourcesFrom(rawSources), inputTokens: completed?.usage?.input_tokens ?? 0, outputTokens: completed?.usage?.output_tokens ?? 0, searchCalls: output.filter((item: any) => item.type === "web_search_call").length }
  }
  const json = await response.json()
  const output = Array.isArray(json.output) ? json.output : []
  const text = typeof json.output_text === "string" ? json.output_text : output.flatMap((item: any) => Array.isArray(item.content) ? item.content.map((part: any) => part.text ?? "") : []).join("")
  const rawSources = output.flatMap((item: any) => item?.action?.sources ?? item?.sources ?? []).map((source: any) => ({ url: source.url, title: source.title }))
  for (const url of json.citations ?? []) rawSources.push({ url, title: undefined })
  if (!text.trim()) throw new AppError("AI_OUTPUT_INVALID")
  return { text, sources: sourcesFrom(rawSources), inputTokens: json.usage?.input_tokens ?? 0, outputTokens: json.usage?.output_tokens ?? 0, searchCalls: output.filter((x: any) => x.type === "web_search_call").length }
}

async function anthropic(provider: AiProviderDescriptor, input: ConciergeGenerationInput) {
  const body: Record<string, unknown> = { model: provider.model, max_tokens: input.maxOutputTokens ?? provider.maxOutputTokens, system: input.system, messages: input.messages, stream: Boolean(input.onDelta) }
  if (input.webResearch) {
    const tool: Record<string, unknown> = { type: /haiku/i.test(provider.model) ? "web_search_20250305" : "web_search_20260318", name: "web_search", max_uses: input.maxSearches ?? env.CONCIERGE_MAX_SEARCH_CALLS }
    if (input.allowedDomains?.length) tool.allowed_domains = input.allowedDomains
    else if (input.blockedDomains?.length) tool.blocked_domains = input.blockedDomains
    body.tools = [tool]
  }
  const response = await fetchTimed("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify(body) }, provider.timeoutMs, input.signal)
  if (!response.ok) throw new AppError("PROVIDER_ERROR", { internal: { provider: provider.id, status: response.status } })
  if (input.onDelta) {
    let text = ""
    let inputTokens = 0
    let outputTokens = 0
    let searchCalls = 0
    const citations: Array<{ url?: unknown; title?: unknown }> = []
    await readSse(response, (_event, data) => {
      if (data?.type === "message_start") inputTokens = data.message?.usage?.input_tokens ?? inputTokens
      if (data?.type === "message_delta") outputTokens = data.usage?.output_tokens ?? outputTokens
      if (data?.type === "content_block_delta" && data.delta?.type === "text_delta" && typeof data.delta.text === "string") {
        text += data.delta.text
        input.onDelta?.(data.delta.text)
      }
      const block = data?.content_block
      if (block?.type === "server_tool_use" && block.name === "web_search") searchCalls += 1
      if (block?.type === "web_search_tool_result") {
        for (const item of Array.isArray(block.content) ? block.content : []) citations.push({ url: item.url, title: item.title })
      }
      for (const citation of block?.citations ?? data?.delta?.citations ?? []) citations.push({ url: citation.url, title: citation.title })
      if (data?.type === "error") throw new AppError("PROVIDER_ERROR", { internal: { provider: provider.id, event: data.error?.type } })
    })
    if (!text.trim()) throw new AppError("AI_OUTPUT_INVALID")
    return { text, sources: sourcesFrom(citations), inputTokens, outputTokens, searchCalls }
  }
  const json = await response.json()
  const blocks = Array.isArray(json.content) ? json.content : []
  const text = blocks.filter((x: any) => x.type === "text").map((x: any) => x.text ?? "").join("")
  const citations = blocks.flatMap((x: any) => x.citations ?? []).map((x: any) => ({ url: x.url, title: x.title }))
  if (!text.trim()) throw new AppError("AI_OUTPUT_INVALID")
  return { text, sources: sourcesFrom(citations), inputTokens: json.usage?.input_tokens ?? 0, outputTokens: json.usage?.output_tokens ?? 0, searchCalls: json.usage?.server_tool_use?.web_search_requests ?? 0 }
}

async function gemini(provider: AiProviderDescriptor, input: ConciergeGenerationInput) {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: input.system }] },
    contents: input.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: input.maxOutputTokens ?? provider.maxOutputTokens },
  }
  if (input.webResearch) body.tools = [{ google_search: {} }]
  const method = input.onDelta ? "streamGenerateContent?alt=sse" : "generateContent"
  const response = await fetchTimed(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:${method}`, { method: "POST", headers: { "x-goog-api-key": env.GEMINI_API_KEY!, "content-type": "application/json" }, body: JSON.stringify(body) }, provider.timeoutMs, input.signal)
  if (!response.ok) throw new AppError("PROVIDER_ERROR", { internal: { provider: provider.id, status: response.status } })
  if (input.onDelta) {
    let text = ""
    let inputTokens = 0
    let outputTokens = 0
    const queries = new Set<string>()
    const citations: Array<{ url?: unknown; title?: unknown }> = []
    await readSse(response, (_event, data) => {
      const candidate = data?.candidates?.[0]
      const delta = (candidate?.content?.parts ?? []).map((part: any) => part.text ?? "").join("")
      if (delta) { text += delta; input.onDelta?.(delta) }
      const grounding = candidate?.groundingMetadata
      for (const chunk of grounding?.groundingChunks ?? []) citations.push({ url: chunk.web?.uri, title: chunk.web?.title })
      for (const query of grounding?.webSearchQueries ?? []) queries.add(query)
      inputTokens = data?.usageMetadata?.promptTokenCount ?? inputTokens
      outputTokens = data?.usageMetadata?.candidatesTokenCount ?? outputTokens
    })
    if (!text.trim()) throw new AppError("AI_OUTPUT_INVALID")
    return { text, sources: sourcesFrom(citations), inputTokens, outputTokens, searchCalls: queries.size || (input.webResearch ? 1 : 0) }
  }
  const json = await response.json()
  const candidate = json.candidates?.[0]
  const text = (candidate?.content?.parts ?? []).map((p: any) => p.text ?? "").join("")
  const chunks = candidate?.groundingMetadata?.groundingChunks ?? []
  const citations = chunks.map((x: any) => ({ url: x.web?.uri, title: x.web?.title }))
  if (!text.trim()) throw new AppError("AI_OUTPUT_INVALID")
  return { text, sources: sourcesFrom(citations), inputTokens: json.usageMetadata?.promptTokenCount ?? 0, outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0, searchCalls: new Set(candidate?.groundingMetadata?.webSearchQueries ?? []).size || (input.webResearch ? 1 : 0) }
}

function mockAnswer(input: ConciergeGenerationInput) {
  const question = input.messages.at(-1)?.content.toLowerCase() ?? ""
  let text = "Perfume is best understood as a composition that changes from opening to dry-down. Tell me which note, perfume, climate, or occasion you want to explore, and I can be more specific."
  if (/grape.*wood|wood.*grape/.test(question)) text = "A grape-like accord with woods usually reads as dark fruity and woody rather than literally like grape juice. Cedar makes it drier and more pencil-like, sandalwood makes it creamier, oud can make it resinous or smoky, and guaiac wood can add a wine-barrel effect. In perfumery, a listed grape note is normally an olfactory impression built from aroma materials, not a stated percentage of grape extract."
  else if (/what is an accord/.test(question)) text = "An accord is a blend of materials that creates one recognizable smell, much like several musical notes forming a chord. A leather, amber, or marine accord may be built from multiple natural and synthetic materials even when no single ingredient smells exactly like the final effect."
  else if (/edp.*edt|edt.*edp/.test(question)) text = "EDP and EDT describe concentration families, but they do not guarantee performance. An EDP usually contains a higher proportion of aromatic concentrate than an EDT, while the formula, materials, climate, and skin can matter just as much for projection and longevity."
  else if (/store|storage|keep perfume/.test(question)) text = "Store perfume upright in a cool, dark place with stable temperature. Keep it away from direct sun, hot cars, steamy bathrooms, and repeated temperature swings; the original box or a closed cupboard works well."
  input.onDelta?.(text)
  return { text, sources: [], inputTokens: 0, outputTokens: 0, searchCalls: 0 }
}

export async function generateConciergeAnswer(input: ConciergeGenerationInput): Promise<ConciergeGenerationResult> {
  const required = [...(input.requiredCapabilities ?? ["CHAT"]), ...(input.webResearch ? ["WEB_SEARCH" as const] : [])]
  const capabilityKey = required.sort().join("+")
  const providers = compatibleProviders(required)
  if (!providers.length) throw new AppError("AI_UNAVAILABLE")
  for (const provider of providers) {
    if (isOpen(provider.id, capabilityKey)) continue
    const started = Date.now()
    let firstTokenAt: number | undefined
    const providerInput: ConciergeGenerationInput = {
      ...input,
      onDelta: input.onDelta ? (delta) => {
        if (!firstTokenAt && delta) firstTokenAt = Date.now()
        input.onDelta?.(delta)
      } : undefined,
    }
    try {
      const result = provider.id === "openai" ? await openAiCompatible(provider, providerInput, "https://api.openai.com/v1", env.OPENAI_API_KEY!)
        : provider.id === "xai" ? await openAiCompatible(provider, providerInput, "https://api.x.ai/v1", env.XAI_API_KEY!)
          : provider.id === "anthropic" ? await anthropic(provider, providerInput)
            : provider.id === "gemini" ? await gemini(provider, providerInput)
              : mockAnswer(providerInput)
      succeeded(provider.id, capabilityKey)
      return { ...result, provider: provider.id, model: provider.model, latencyMs: Date.now() - started, ...(firstTokenAt ? { firstTokenLatencyMs: firstTokenAt - started } : {}) }
    } catch (error) {
      failed(provider.id, capabilityKey)
      logger.warn("concierge_provider_failed", { provider: provider.id, capability: capabilityKey, internal: error instanceof Error ? error.message : String(error) })
      if (input.signal?.aborted) throw error
      if (firstTokenAt) throw error
    }
  }
  throw new AppError("AI_UNAVAILABLE")
}

export function conciergeProviderStatus() {
  return providerDescriptors().map((descriptor) => ({ ...descriptor, circuits: [...breaker.entries()].filter(([key]) => key.startsWith(`${descriptor.id}:`)).map(([capability, state]) => ({ capability: capability.split(":").slice(1).join(":"), openUntil: state.openUntil || null })) }))
}

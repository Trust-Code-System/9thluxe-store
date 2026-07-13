import { randomUUID } from "node:crypto"
import { env } from "@/lib/env"
import { AppError } from "@/lib/http/errors"
import { generateConciergeAnswer } from "@/integrations/ai/router"
import { hostedWebResearch } from "@/integrations/web-search/hosted"
import { boundedContext, reduceConversationState } from "./context"
import { loadOwnedConversation, persistSuccessfulTurn } from "./conversation"
import { conciergeSystemPrompt } from "./prompt"
import { routeConciergeIntent } from "./router"
import { ensureCitationMarkers, safetyAnswer, sanitizeConciergeDelta, sanitizeConciergeText, validateSources } from "./response-policy"
import { searchFadeCatalogue, findSimilarCatalogueProducts, getFadeProductsBatch } from "./tools/catalogue"
import { getApprovedScentAtlas, searchApprovedPerfumeKnowledge } from "./tools/knowledge"
import { getReviewSummary } from "./tools/reviews"
import { getLayeringSuggestions, getUserScentProfile } from "./tools/user"
import type { ConciergeEvidence, ConciergeIdentity, ConciergeTurnResult } from "./types"

export interface OrchestrateInput {
  requestId: string
  identity: ConciergeIdentity
  message: string
  conversationId?: string
  sampleFirst?: boolean
  signal?: AbortSignal
  onStatus?: (status: string) => void
  onDelta?: (delta: string) => void
}

function referencedProductIds(message: string, ids: string[]) {
  if (/\b(?:second|2nd)\b/i.test(message)) return ids[1] ? [ids[1]] : []
  if (/\b(?:third|3rd)\b/i.test(message)) return ids[2] ? [ids[2]] : []
  if (/\b(?:first|1st|that one|it)\b/i.test(message) && ids[0]) return [ids[0]]
  return ids
}

function supportAnswer(message: string) {
  if (/order|delivery|shipping|refund|return|payment/i.test(message)) return "For an order, delivery, payment, refund, or return issue, please use your account order page or contact Fádé support with the order reference. I will not ask you to post payment details or private order information in this perfume chat."
  return null
}

export async function orchestrateConciergeTurn(input: OrchestrateInput): Promise<ConciergeTurnResult> {
  const existing = await loadOwnedConversation(input.conversationId, input.identity)
  const conversationId = existing?.id ?? randomUUID()
  const previousState = existing?.state ?? { activeProductIds: [], externalPerfumes: [], preferredNotes: [], excludedNotes: [], preferredFamilies: [] }
  const intent = routeConciergeIntent(input.message, previousState)
  input.onStatus?.("Understanding your question")

  const direct = safetyAnswer(intent.primaryIntent, input.message) ?? (intent.primaryIntent === "ORDER_OR_STORE_SUPPORT" ? supportAnswer(input.message) : null)
  const evidence: ConciergeEvidence[] = []
  let products: ConciergeTurnResult["products"] = []
  const toolCalls: string[] = []
  let emittedText = false
  const emitDelta = input.onDelta ? (delta: string) => {
    const safe = sanitizeConciergeDelta(delta)
    if (!safe) return
    emittedText = true
    input.onDelta?.(safe)
  } : undefined
  const profile = input.identity.userId ? await getUserScentProfile(input.identity.userId) : null
  if (profile) toolCalls.push("getUserScentProfile")

  if (intent.requiresCatalogue || (intent.requiresConversationContext && previousState.activeProductIds.length)) {
    input.onStatus?.("Checking the live Fádé catalogue")
    const activeIds = referencedProductIds(input.message, previousState.activeProductIds)
    const wantsCheaper = /\b(?:cheaper|less expensive|more affordable|lower budget)\b/i.test(input.message)
    const current = wantsCheaper && activeIds.length ? await getFadeProductsBatch(activeIds) : null
    if (current) toolCalls.push("getFadeProductsBatch")
    const cheaperThan = current?.products.length ? Math.max(1, Math.min(...current.products.map((product) => product.priceNGN)) - 1) : undefined
    const excludedTerms = [...intent.entities.notes, ...intent.entities.accords].filter((term) => new RegExp(`(?:no|without|avoid|remove|not too)\\s+(?:anything\\s+)?${term}`, "i").test(input.message))
    const catalogue = intent.entities.perfumeNames.length > 1
      ? await Promise.all(intent.entities.perfumeNames.map((name) => searchFadeCatalogue({ query: name, inStockOnly: intent.requiresLiveStock, limit: 2 }))).then((results) => ({ products: results.flatMap((result) => result.products).filter((product, index, all) => all.findIndex((candidate) => candidate.id === product.id) === index), evidence: results.flatMap((result) => result.evidence), checkedAt: new Date().toISOString() }))
      : wantsCheaper
      ? await searchFadeCatalogue({ budgetMaxNGN: intent.entities.budgetMaxNGN ?? cheaperThan ?? previousState.budgetMaxNGN, inStockOnly: true, excludeProductIds: activeIds, occasions: intent.entities.occasions, climates: intent.entities.climates, families: intent.entities.families, excludeTerms: excludedTerms, unisexOnly: /\bunisex\b/i.test(input.message), limit: 8 })
      : intent.requiresConversationContext && activeIds.length
      ? await searchFadeCatalogue({ productIds: activeIds, inStockOnly: intent.requiresLiveStock, sampleFirst: input.sampleFirst ?? previousState.sampleFirst, limit: 8 })
      : intent.primaryIntent === "SIMILAR_PERFUME"
        ? await findSimilarCatalogueProducts(previousState, 8)
        : await searchFadeCatalogue({
          query: intent.entities.perfumeNames[0], notes: intent.entities.notes,
          occasions: intent.entities.occasions, climates: intent.entities.climates, families: intent.entities.families,
          excludeTerms: excludedTerms, unisexOnly: /\bunisex\b/i.test(input.message),
          budgetMaxNGN: intent.entities.budgetMaxNGN ?? previousState.budgetMaxNGN,
          inStockOnly: intent.requiresLiveStock, sampleFirst: input.sampleFirst ?? previousState.sampleFirst, limit: 8,
        })
    products = catalogue.products
    evidence.push(...catalogue.evidence)
    toolCalls.push(intent.primaryIntent === "SIMILAR_PERFUME" ? "findSimilarCatalogueProducts" : "searchFadeCatalogue")
    const atlas = await Promise.all(products.slice(0, 6).map((product) => getApprovedScentAtlas(product.id)))
    const approvedAtlas = atlas.flat()
    if (approvedAtlas.length) { evidence.push(...approvedAtlas); toolCalls.push("getApprovedScentAtlas") }
    if (intent.primaryIntent === "REVIEW_RESEARCH") {
      const reviewEvidence = await Promise.all(products.slice(0, 4).map(async (product) => ({ product, summary: await getReviewSummary(product.id) })))
      for (const item of reviewEvidence) evidence.push({ scope: "FADE_CATALOGUE", title: `${item.product.name} Fádé reviews`, content: JSON.stringify(item.summary), provenance: "Moderated Fádé reviews, verified-purchase count separated", retrievedAt: new Date().toISOString() })
      toolCalls.push("getReviewSummary")
    }
  }

  if (!intent.requiresWebResearch && !intent.requiresCatalogue && intent.primaryIntent !== "OUT_OF_SCOPE") {
    const lookup = intent.entities.notes[0] ?? intent.entities.families[0] ?? input.message.slice(0, 80)
    try {
      const knowledge = await searchApprovedPerfumeKnowledge(lookup, 5)
      if (knowledge.length) { evidence.push(...knowledge); toolCalls.push("searchApprovedPerfumeKnowledge") }
    } catch {
      // The approved knowledge table may be empty during rollout. General model knowledge remains clearly non-catalogue.
    }
  }

  if (intent.primaryIntent === "LAYERING") {
    const suggestion = getLayeringSuggestions(intent.entities.notes)
    evidence.push({ scope: "APPROVED_KNOWLEDGE", title: "Layering principles", content: `${suggestion.order}\n${suggestion.ratio}\n${suggestion.cautions.join("\n")}`, provenance: "Fádé deterministic layering guidance", retrievedAt: new Date().toISOString() })
    toolCalls.push("getLayeringSuggestions")
  }

  const stateForPrompt = { ...previousState, ...(profile ? { budgetMaxNGN: previousState.budgetMaxNGN ?? profile.budgetMaxNGN ?? undefined } : {}), sampleFirst: input.sampleFirst ?? previousState.sampleFirst }
  let answer = direct
  let sources: ConciergeTurnResult["sources"] = []
  let provider: string | undefined
  let model: string | undefined
  let inputTokens = 0
  let outputTokens = 0
  let searchCalls = 0
  let firstTokenLatencyMs: number | undefined
  let providerLatencyMs: number | undefined

  if (!answer && intent.requiresWebResearch && !env.CONCIERGE_CATALOGUE_ONLY) {
    input.onStatus?.("Researching current sources")
    const research = await hostedWebResearch.search({ query: input.message, system: conciergeSystemPrompt(intent, stateForPrompt, evidence), maxSearches: env.CONCIERGE_MAX_SEARCH_CALLS, freshness: "CURRENT", signal: input.signal })
    sources = validateSources(research.sources)
    if (!sources.length) answer = "I could not verify that current information with usable sources, so I will not present an unverified answer as fact. You can ask me for general perfume guidance or a live Fádé catalogue check instead."
    else answer = research.answerContext
    provider = research.usage.provider; model = research.usage.model; inputTokens = research.usage.inputTokens; outputTokens = research.usage.outputTokens; searchCalls = research.usage.searches
    firstTokenLatencyMs = research.usage.firstTokenLatencyMs; providerLatencyMs = research.usage.latencyMs
    toolCalls.push("searchCurrentWeb")
  }

  if (!answer) {
    input.onStatus?.("Composing a grounded answer")
    const context = boundedContext(existing?.messages ?? [], stateForPrompt)
    const generated = await generateConciergeAnswer({
      system: conciergeSystemPrompt(intent, stateForPrompt, evidence),
      messages: [...context.recentMessages.map((message) => ({ role: message.role === "assistant" ? "assistant" as const : "user" as const, content: message.content })), { role: "user", content: input.message }],
      requiredCapabilities: ["CHAT"], maxOutputTokens: env.CONCIERGE_MAX_OUTPUT_TOKENS, signal: input.signal,
      onDelta: emitDelta,
    })
    answer = generated.text; sources = validateSources(generated.sources); provider = generated.provider; model = generated.model; inputTokens = generated.inputTokens; outputTokens = generated.outputTokens
    firstTokenLatencyMs = generated.firstTokenLatencyMs; providerLatencyMs = generated.latencyMs
  }
  if (input.signal?.aborted) throw new AppError("SERVICE_UNAVAILABLE", { message: "Generation was cancelled." })
  const sanitizedAnswer = sanitizeConciergeText(answer)
  answer = ensureCitationMarkers(sanitizedAnswer, sources)
  if (!emittedText) emitDelta?.(answer)
  else if (answer.length > sanitizedAnswer.length) emitDelta?.(answer.slice(sanitizedAnswer.length))
  const nextState = reduceConversationState(stateForPrompt, intent, input.message, products.map((product) => product.id))
  const saved = await persistSuccessfulTurn({ conversationId, existingConversation: Boolean(existing), identity: input.identity, userMessage: input.message, assistantMessage: answer, intent: intent.primaryIntent, state: nextState, sources, productIds: products.map((product) => product.id) })
  return {
    conversationId, messageId: saved.id, answer, intent, products, sources,
    evidenceScopes: [...new Set(evidence.map((item) => item.scope).concat(sources.length ? ["CURRENT_WEB"] : []))],
    provider, model, usage: { inputTokens, outputTokens, searchCalls, toolCalls: toolCalls.slice(0, env.CONCIERGE_MAX_TOOL_CALLS), firstTokenLatencyMs, providerLatencyMs }, state: nextState,
  }
}

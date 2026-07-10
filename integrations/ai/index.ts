// integrations/ai/index.ts
// Resilient AI layer: provider selection, PII redaction of prompts, bounded calls (timeout,
// token ceiling), retry, circuit breaker, fallback to the deterministic mock, structured-output
// validation, and cost/model/prompt-version logging. Safe failure surfaces AppError codes.
import { z } from 'zod'
import { AppError } from '@/lib/http/errors'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'
import type {
  AiProvider,
  AiCallOptions,
  AiServices,
  IntentResult,
  RecommendationExplanationInput,
  ReviewSummaryInput,
  ReviewSummary,
} from './types'
import { mockAiProvider } from './mock'
import { anthropicProvider } from './anthropic'
import { openaiProvider } from './openai'
import { geminiProvider } from './gemini'
import { recordAiUsage } from './cost'

function selectProvider(): AiProvider {
  switch (env.AI_PROVIDER) {
    case 'anthropic':
      return env.ANTHROPIC_API_KEY ? anthropicProvider : mockAiProvider
    case 'openai':
      return env.OPENAI_API_KEY ? openaiProvider : mockAiProvider
    case 'gemini':
      return env.GEMINI_API_KEY ? geminiProvider : mockAiProvider
    default:
      return mockAiProvider
  }
}

// --- Circuit breaker (per provider name) ---
const breaker = new Map<string, { failures: number; openUntil: number }>()
const FAILURE_THRESHOLD = 4
const OPEN_MS = 30_000

function circuitOpen(name: string): boolean {
  const b = breaker.get(name)
  return !!b && b.openUntil > Date.now()
}
function recordFailure(name: string) {
  const b = breaker.get(name) ?? { failures: 0, openUntil: 0 }
  b.failures += 1
  if (b.failures >= FAILURE_THRESHOLD) {
    b.openUntil = Date.now() + OPEN_MS
    b.failures = 0
  }
  breaker.set(name, b)
}
function recordSuccess(name: string) {
  breaker.set(name, { failures: 0, openUntil: 0 })
}

/** Remove obvious PII before any prompt leaves the server. Addresses/payment must never be sent. */
export function scrubPrompt(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\b\d{16}\b/g, '[card]') // card before phone so 16-digit PANs aren't caught as phones
    .replace(/\+?\d[\d\s-]{8,}\d/g, '[phone]')
    .slice(0, 6000) // hard input ceiling
}

async function withTimeout<T>(p: Promise<T>, ms: number, name: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AppError('PROVIDER_TIMEOUT', { internal: `${name} timeout` })), ms)
  })
  try {
    return await Promise.race([p, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

/**
 * Generate a JSON object validated against `schema`. On any provider error, times out, or invalid
 * JSON, retries once, then falls back to the mock provider; if the mock's output also fails schema
 * validation, throws AppError('AI_OUTPUT_INVALID').
 */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
  opts: AiCallOptions,
): Promise<T> {
  const primary = selectProvider()
  const timeoutMs = opts.timeoutMs ?? 10_000
  const safeUser = scrubPrompt(user)

  const attempt = async (provider: AiProvider): Promise<T> => {
    if (circuitOpen(provider.name)) throw new AppError('AI_UNAVAILABLE', { internal: 'circuit open' })
    const { text, usage } = await withTimeout(provider.complete(system, safeUser, opts), timeoutMs, provider.name)
    logger.info('ai_call', {
      provider: provider.name,
      model: provider.model,
      task: opts.task,
      promptVersion: opts.promptVersion,
      latencyMs: usage.latencyMs,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    })
    recordAiUsage({
      task: opts.task,
      provider: provider.name,
      model: provider.model,
      promptVersion: opts.promptVersion,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    })
    let parsed: unknown
    try {
      parsed = JSON.parse(extractJson(text))
    } catch {
      throw new AppError('AI_OUTPUT_INVALID', { internal: 'non-json output' })
    }
    return schema.parse(parsed)
  }

  // Try primary (with one retry), then mock fallback.
  for (const provider of primary.name === 'mock' ? [primary] : [primary, primary, mockAiProvider]) {
    try {
      const result = await attempt(provider)
      recordSuccess(provider.name)
      return result
    } catch {
      recordFailure(provider.name)
      logger.warn('ai_attempt_failed', { provider: provider.name, task: opts.task })
      // continue to next provider/attempt
      if (provider === mockAiProvider) break
    }
  }
  throw new AppError('AI_OUTPUT_INVALID')
}

/** Pull the first JSON object/array out of a model response that may include prose. */
function extractJson(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed
  const match = trimmed.match(/[{[][\s\S]*[}\]]/)
  return match ? match[0] : trimmed
}

// --- Zod schemas for structured tasks ---
const intentSchema = z.object({
  intent: z.enum(['recommend', 'compare', 'gift', 'layering', 'similar', 'sample_first', 'support', 'unsupported']),
  budgetMaxNGN: z.number().int().positive().nullable(),
  includeNotes: z.array(z.string()).default([]),
  excludeNotes: z.array(z.string()).default([]),
  occasion: z.string().nullable().default(null),
  climate: z.string().nullable().default(null),
})
const explanationSchema = z.object({ explanation: z.string().max(600) })
const supportSchema = z.object({ answer: z.string().max(1200), escalate: z.boolean() })
const reviewSummarySchema = z.object({
  summary: z.string().max(800),
  reviewsSummarized: z.number().int().nonnegative(),
  isAiSummary: z.literal(true),
})
const marketingSchema = z.object({ draft: z.string().max(4000) })
const ownerBriefSchema = z.object({ summary: z.string().max(1200), actions: z.array(z.string()).max(10) })

const PV = 'v1' // prompt version

export const aiServices: AiServices = {
  async classifyIntent({ message }): Promise<IntentResult> {
    const parsed = await generateStructured(
      intentSchema,
      'You extract fragrance shopping intent as strict JSON. Only use fields provided. Do not give medical or allergy advice.',
      message,
      { task: 'classify_intent', promptVersion: PV, temperature: 0 },
    )
    return {
      intent: parsed.intent,
      budgetMaxNGN: parsed.budgetMaxNGN,
      includeNotes: parsed.includeNotes ?? [],
      excludeNotes: parsed.excludeNotes ?? [],
      occasion: parsed.occasion ?? null,
      climate: parsed.climate ?? null,
    }
  },
  async explainRecommendation(input: RecommendationExplanationInput) {
    return generateStructured(
      explanationSchema,
      'Explain, in <=2 sentences, why these already-selected products fit the request. Do not invent products or claims.',
      JSON.stringify(input),
      { task: 'explain_recommendation', promptVersion: PV },
    )
  },
  async answerSupport(input) {
    return generateStructured(
      supportSchema,
      'Answer using only the provided context. If it cannot be answered, set escalate=true. No medical/health guarantees.',
      JSON.stringify(input),
      { task: 'answer_support', promptVersion: PV },
    )
  },
  async summarizeReviews(input: ReviewSummaryInput): Promise<ReviewSummary> {
    return generateStructured(
      reviewSummarySchema,
      'Summarize these real reviews faithfully. Report the count. Do not turn minority opinions into universal claims.',
      JSON.stringify(input),
      { task: 'summarize_reviews', promptVersion: PV },
    )
  },
  async draftMarketing(input) {
    return generateStructured(
      marketingSchema,
      'Draft marketing copy for a perfume. This is a draft for human review; it is never auto-sent.',
      JSON.stringify(input),
      { task: 'draft_marketing', promptVersion: PV, temperature: 0.4 },
    )
  },
  async ownerBrief(input) {
    return generateStructured(
      ownerBriefSchema,
      'Summarize the business metrics and propose actions. Every claim must be traceable to the metrics JSON.',
      JSON.stringify(input),
      { task: 'owner_brief', promptVersion: PV },
    )
  },
}

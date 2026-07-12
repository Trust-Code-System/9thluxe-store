// integrations/ai/types.ts
// Provider-independent AI layer. Application code depends on these interfaces, never on a specific
// model SDK. Every call is bounded (timeout, token ceiling), logged (cost/model/prompt version),
// redacted (no PII/addresses/payment/private conversations sent), and schema-validated on output.
import type { z } from 'zod'

export interface AiCallOptions {
  /** Logical task name for cost/version logging. */
  task: string
  promptVersion: string
  maxOutputTokens?: number
  timeoutMs?: number
  temperature?: number
}

export interface AiUsage {
  provider: string
  model: string
  task: string
  promptVersion: string
  inputTokens?: number
  outputTokens?: number
  latencyMs: number
}

/** Low-level provider contract. Adapters implement this; the wrapper adds resilience. */
export interface AiProvider {
  readonly name: 'mock' | 'anthropic' | 'openai' | 'gemini' | 'xai'
  readonly model: string
  /** Return raw text completion for a system+user prompt. */
  complete(system: string, user: string, opts: AiCallOptions): Promise<{ text: string; usage: Partial<AiUsage> }>
}

/** High-level, catalogue-grounded services. Each validates output against a Zod schema. */
export interface AiServices {
  classifyIntent(input: { message: string }): Promise<IntentResult>
  explainRecommendation(input: RecommendationExplanationInput): Promise<{ explanation: string }>
  answerSupport(input: { question: string; context: string }): Promise<{ answer: string; escalate: boolean }>
  summarizeReviews(input: ReviewSummaryInput): Promise<ReviewSummary>
  draftMarketing(input: { brief: string }): Promise<{ draft: string }>
  ownerBrief(input: { metricsJson: string }): Promise<{ summary: string; actions: string[] }>
}

export interface IntentResult {
  intent:
    | 'recommend'
    | 'compare'
    | 'gift'
    | 'layering'
    | 'similar'
    | 'sample_first'
    | 'support'
    | 'unsupported'
  budgetMaxNGN: number | null
  includeNotes: string[]
  excludeNotes: string[]
  occasion: string | null
  climate: string | null
}

export interface RecommendationExplanationInput {
  query: string
  products: Array<{ name: string; notesTop?: string | null; notesHeart?: string | null; notesBase?: string | null }>
}

export interface ReviewSummaryInput {
  productName: string
  reviews: Array<{ rating: number; comment: string }>
}

export interface ReviewSummary {
  summary: string
  reviewsSummarized: number
  isAiSummary: true
}

export type StructuredSchema<T> = z.ZodType<T>

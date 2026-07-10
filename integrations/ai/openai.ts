// integrations/ai/openai.ts
// OpenAI adapter. Active only when AI_PROVIDER=openai AND OPENAI_API_KEY is set.
// Defaults to the latest GPT-5.6 family (2026-07); override with OPENAI_MODEL.
// GPT-5.x on Chat Completions requires `max_completion_tokens` (not `max_tokens`) and only supports
// the default temperature, so we adapt the request shape to the selected model.
import { AppError } from '@/lib/http/errors'
import { env } from '@/lib/env'
import type { AiProvider, AiCallOptions } from './types'

const DEFAULT_MODEL = 'gpt-5.6-terra' // balanced intelligence/cost; alias gpt-5.6 -> sol (flagship)

/** Newer OpenAI models (gpt-5.x / o-series) changed the token param + dropped custom temperature. */
function isNextGen(model: string): boolean {
  return /^(gpt-5|o[0-9])/i.test(model)
}

export const openaiProvider: AiProvider = {
  name: 'openai',
  get model() {
    return env.OPENAI_MODEL || DEFAULT_MODEL
  },
  async complete(system: string, user: string, opts: AiCallOptions) {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new AppError('AI_UNAVAILABLE', { internal: 'OPENAI_API_KEY missing' })
    const model = env.OPENAI_MODEL || DEFAULT_MODEL
    const nextGen = isNextGen(model)
    const start = Date.now()

    const payload: Record<string, unknown> = {
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }
    // Token ceiling: new models use max_completion_tokens; legacy models use max_tokens.
    if (nextGen) payload.max_completion_tokens = opts.maxOutputTokens ?? 1024
    else payload.max_tokens = opts.maxOutputTokens ?? 1024
    // Only legacy models accept a custom temperature; gpt-5.x/o-series use the default (1).
    if (!nextGen) payload.temperature = opts.temperature ?? 0

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new AppError('PROVIDER_ERROR', { internal: { status: res.status } })
    const body = await res.json()
    const text = body?.choices?.[0]?.message?.content ?? ''
    return {
      text,
      usage: {
        provider: 'openai',
        model,
        inputTokens: body?.usage?.prompt_tokens,
        outputTokens: body?.usage?.completion_tokens,
        latencyMs: Date.now() - start,
      },
    }
  },
}

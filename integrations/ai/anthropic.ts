// integrations/ai/anthropic.ts
// Anthropic adapter. Active only when AI_PROVIDER=anthropic AND ANTHROPIC_API_KEY is set.
// Uses the Messages API. Kept minimal + typed; resilience (timeout/retry/circuit) is added by index.ts.
import { AppError } from '@/lib/http/errors'
import { env } from '@/lib/env'
import type { AiProvider, AiCallOptions } from './types'

// Latest fast + inexpensive Claude for structured tasks (2026-07). Override with ANTHROPIC_MODEL.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

export const anthropicProvider: AiProvider = {
  name: 'anthropic',
  get model() {
    return env.ANTHROPIC_MODEL || DEFAULT_MODEL
  },
  async complete(system: string, user: string, opts: AiCallOptions) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new AppError('AI_UNAVAILABLE', { internal: 'ANTHROPIC_API_KEY missing' })
    const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL
    const start = Date.now()
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxOutputTokens ?? 1024,
        temperature: opts.temperature ?? 0,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
    if (!res.ok) throw new AppError('PROVIDER_ERROR', { internal: { status: res.status } })
    const body = await res.json()
    const text = Array.isArray(body?.content)
      ? body.content.map((c: any) => c?.text ?? '').join('')
      : ''
    return {
      text,
      usage: {
        provider: 'anthropic',
        model,
        inputTokens: body?.usage?.input_tokens,
        outputTokens: body?.usage?.output_tokens,
        latencyMs: Date.now() - start,
      },
    }
  },
}

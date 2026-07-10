// integrations/ai/gemini.ts
// Google Gemini adapter. Active only when AI_PROVIDER=gemini AND GEMINI_API_KEY is set.
// Uses the Generative Language API generateContent endpoint with JSON response mode. Kept minimal +
// typed; resilience (timeout/retry/circuit/validation) is added by index.ts.
import { AppError } from '@/lib/http/errors'
import { env } from '@/lib/env'
import type { AiProvider, AiCallOptions } from './types'

const MODEL = 'gemini-3.5-flash' // latest stable GA Flash (2026-05); override with GEMINI_MODEL

export const geminiProvider: AiProvider = {
  name: 'gemini',
  model: MODEL,
  async complete(system: string, user: string, opts: AiCallOptions) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new AppError('AI_UNAVAILABLE', { internal: 'GEMINI_API_KEY missing' })
    const model = env.GEMINI_MODEL || MODEL
    const start = Date.now()

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            temperature: opts.temperature ?? 0,
            maxOutputTokens: opts.maxOutputTokens ?? 1024,
            // Force JSON so the structured-output validator in index.ts can parse it directly.
            responseMimeType: 'application/json',
          },
        }),
      },
    )
    if (!res.ok) throw new AppError('PROVIDER_ERROR', { internal: { status: res.status } })
    const body = await res.json()
    const text = Array.isArray(body?.candidates?.[0]?.content?.parts)
      ? body.candidates[0].content.parts.map((p: any) => p?.text ?? '').join('')
      : ''
    return {
      text,
      usage: {
        provider: 'gemini',
        model,
        inputTokens: body?.usageMetadata?.promptTokenCount,
        outputTokens: body?.usageMetadata?.candidatesTokenCount,
        latencyMs: Date.now() - start,
      },
    }
  },
}

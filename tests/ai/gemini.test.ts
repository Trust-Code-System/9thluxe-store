import { describe, it, expect } from 'vitest'
import { geminiProvider } from '@/integrations/ai/gemini'
import { AppError } from '@/lib/http/errors'

describe('Gemini AI provider adapter', () => {
  it('declares the expected provider identity', () => {
    expect(geminiProvider.name).toBe('gemini')
    expect(geminiProvider.model).toContain('gemini')
  })

  it('fails safe (AI_UNAVAILABLE) when GEMINI_API_KEY is absent — never calls the network', async () => {
    const prev = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    try {
      await geminiProvider.complete('sys', 'user', { task: 'classify_intent', promptVersion: 'v1' })
      throw new Error('expected to throw')
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).code).toBe('AI_UNAVAILABLE')
    } finally {
      if (prev !== undefined) process.env.GEMINI_API_KEY = prev
    }
  })
})

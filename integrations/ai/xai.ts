import { AppError } from "@/lib/http/errors"
import { env } from "@/lib/env"
import type { AiProvider, AiCallOptions } from "./types"

export const xaiProvider: AiProvider = {
  name: "xai",
  get model() { return env.XAI_MODEL },
  async complete(system: string, user: string, opts: AiCallOptions) {
    if (!env.XAI_API_KEY) throw new AppError("AI_UNAVAILABLE", { internal: "XAI_API_KEY missing" })
    const started = Date.now()
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST", headers: { authorization: `Bearer ${env.XAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: env.XAI_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, max_tokens: opts.maxOutputTokens ?? 1024 }),
    })
    if (!response.ok) throw new AppError("PROVIDER_ERROR", { internal: { provider: "xai", status: response.status } })
    const json = await response.json()
    return { text: json.choices?.[0]?.message?.content ?? "", usage: { provider: "xai", model: env.XAI_MODEL, inputTokens: json.usage?.prompt_tokens, outputTokens: json.usage?.completion_tokens, latencyMs: Date.now() - started } }
  },
}

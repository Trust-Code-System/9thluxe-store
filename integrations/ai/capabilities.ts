import { env } from "@/lib/env"

export type AiCapability = "CHAT" | "REASONING" | "STRUCTURED_OUTPUT" | "TOOL_CALLING" | "WEB_SEARCH" | "STREAMING" | "VISION" | "LONG_CONTEXT"
export type AiProviderId = "openai" | "anthropic" | "gemini" | "xai" | "mock"

export interface AiProviderDescriptor {
  id: AiProviderId
  enabled: boolean
  model: string
  capabilities: AiCapability[]
  priority: number
  timeoutMs: number
  maxOutputTokens: number
}

const configured = (id: AiProviderId) => {
  if (id === "openai") return Boolean(env.OPENAI_API_KEY)
  if (id === "anthropic") return Boolean(env.ANTHROPIC_API_KEY)
  if (id === "gemini") return Boolean(env.GEMINI_API_KEY)
  if (id === "xai") return Boolean(env.XAI_API_KEY)
  return env.NODE_ENV !== "production" || env.AI_DEMO_MODE
}

export function providerDescriptors(): AiProviderDescriptor[] {
  const order = env.AI_PROVIDER_PRIORITY.split(",").map((x) => x.trim())
  const priority = (id: string) => { const i = order.indexOf(id); return i < 0 ? 99 : i }
  const descriptors: AiProviderDescriptor[] = [
    { id: "openai", enabled: configured("openai"), model: env.OPENAI_MODEL, capabilities: ["CHAT", "REASONING", "STRUCTURED_OUTPUT", "TOOL_CALLING", "WEB_SEARCH", "STREAMING", "VISION", "LONG_CONTEXT"], priority: priority("openai"), timeoutMs: 30_000, maxOutputTokens: env.CONCIERGE_MAX_OUTPUT_TOKENS },
    { id: "anthropic", enabled: configured("anthropic"), model: env.ANTHROPIC_MODEL, capabilities: ["CHAT", "REASONING", "STRUCTURED_OUTPUT", "TOOL_CALLING", "WEB_SEARCH", "STREAMING", "VISION", "LONG_CONTEXT"], priority: priority("anthropic"), timeoutMs: 30_000, maxOutputTokens: env.CONCIERGE_MAX_OUTPUT_TOKENS },
    { id: "gemini", enabled: configured("gemini"), model: env.GEMINI_MODEL, capabilities: ["CHAT", "REASONING", "STRUCTURED_OUTPUT", "TOOL_CALLING", "WEB_SEARCH", "STREAMING", "VISION", "LONG_CONTEXT"], priority: priority("gemini"), timeoutMs: 30_000, maxOutputTokens: env.CONCIERGE_MAX_OUTPUT_TOKENS },
    { id: "xai", enabled: configured("xai"), model: env.XAI_MODEL, capabilities: ["CHAT", "REASONING", "STRUCTURED_OUTPUT", "TOOL_CALLING", "WEB_SEARCH", "STREAMING", "VISION", "LONG_CONTEXT"], priority: priority("xai"), timeoutMs: 30_000, maxOutputTokens: env.CONCIERGE_MAX_OUTPUT_TOKENS },
    { id: "mock", enabled: configured("mock"), model: "mock-concierge-v2", capabilities: ["CHAT", "STRUCTURED_OUTPUT", "STREAMING"], priority: 1000, timeoutMs: 1_000, maxOutputTokens: env.CONCIERGE_MAX_OUTPUT_TOKENS },
  ]
  return descriptors.sort((a, b) => a.priority - b.priority)
}

export function compatibleProviders(required: AiCapability[]) {
  return providerDescriptors().filter((provider) => provider.enabled && required.every((capability) => provider.capabilities.includes(capability)))
}

import type { ConciergeIntent, ConciergeSource } from "./types"

export function sanitizeConciergeText(text: string) {
  return text
    .replace(/[\u2014\u2013]/g, ",")
    .replace(/<\/?(?:script|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12_000)
}

export function sanitizeConciergeDelta(text: string) {
  return text.replace(/[\u2014\u2013]/g, ",")
}

export function ensureCitationMarkers(text: string, sources: ConciergeSource[]) {
  if (!sources.length || /\[\d+\]/.test(text)) return text
  return `${text}\n\nResearch sources: ${sources.map((_, index) => `[${index + 1}]`).join(" ")}`
}

export function validateSources(sources: ConciergeSource[]) {
  return sources.filter((source) => {
    try { const url = new URL(source.url); return url.protocol === "https:" && (url.hostname === source.domain || url.hostname.replace(/^www\./, "") === source.domain) }
    catch { return false }
  }).slice(0, 12)
}

export function safetyAnswer(intent: ConciergeIntent, message: string): string | null {
  if (intent === "MEDICAL_OR_ALLERGY_SENSITIVE") {
    if (/irritated skin/i.test(message)) return "Do not apply perfume to irritated or broken skin. Stop using the product on that area and ask a qualified clinician or pharmacist if irritation persists or is severe. A perfume cannot be guaranteed allergy-safe, and natural materials are not automatically safer than synthetic ones."
    if (/headache/i.test(message)) return "Perfume can trigger headaches for some people, but I cannot diagnose the cause. Stop exposure, move to fresh air, and speak with a clinician if headaches are severe, frequent, new, or accompanied by other symptoms. Testing lightly on clothing or using an unscented environment may help you identify patterns without treating this as a diagnosis."
    return "Perfume is not a medical treatment and no fragrance can be guaranteed allergy-safe. Check the ingredient and allergen information supplied with the product, patch-test only on healthy skin if appropriate, stop if irritation occurs, and ask a qualified clinician for personal medical advice."
  }
  if (intent === "OUT_OF_SCOPE") return "I can help with perfume, fragrance materials, scent technique, Fádé products, and related store questions. I cannot help with that request, but you can ask me about a note, perfume, occasion, climate, comparison, or item in the Fádé catalogue."
  return null
}

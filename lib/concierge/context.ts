import { EMPTY_CONVERSATION_STATE, type ConciergeConversationState, type ConciergeIntentResult } from "./types"

const unique = (values: string[]) => [...new Set(values.map((value) => value.toLowerCase().trim()).filter(Boolean))].slice(0, 20)

export function parseConversationState(value: unknown): ConciergeConversationState {
  if (!value || typeof value !== "object") return { ...EMPTY_CONVERSATION_STATE }
  const state = value as Partial<ConciergeConversationState>
  return {
    ...EMPTY_CONVERSATION_STATE,
    ...state,
    activeProductIds: Array.isArray(state.activeProductIds) ? state.activeProductIds.slice(0, 20) : [],
    externalPerfumes: Array.isArray(state.externalPerfumes) ? state.externalPerfumes.slice(0, 20) : [],
    preferredNotes: Array.isArray(state.preferredNotes) ? state.preferredNotes.slice(0, 20) : [],
    excludedNotes: Array.isArray(state.excludedNotes) ? state.excludedNotes.slice(0, 20) : [],
    preferredFamilies: Array.isArray(state.preferredFamilies) ? state.preferredFamilies.slice(0, 12) : [],
  }
}

export function reduceConversationState(
  previous: ConciergeConversationState,
  route: ConciergeIntentResult,
  message: string,
  productIds: string[] = [],
): ConciergeConversationState {
  const lower = message.toLowerCase()
  const excluded = route.entities.notes.filter((note) => new RegExp(`(?:no|without|avoid|remove)\\s+${note}`, "i").test(lower))
  const preferred = route.entities.notes.filter((note) => !excluded.includes(note))
  const intensity = /\b(?:subtle|soft|skin scent)\b/i.test(message) ? "subtle"
    : /\b(?:strong|intense|powerful|high projection)\b/i.test(message) ? "strong"
      : previous.intensityPreference
  const next: ConciergeConversationState = {
    ...previous,
    lastIntent: route.primaryIntent,
    activeProductIds: productIds.length ? productIds.slice(0, 20) : previous.activeProductIds,
    preferredNotes: unique([...previous.preferredNotes, ...preferred]),
    excludedNotes: unique([...previous.excludedNotes, ...excluded]),
    preferredFamilies: unique([...previous.preferredFamilies, ...route.entities.families]),
    budgetMaxNGN: route.entities.budgetMaxNGN ?? previous.budgetMaxNGN,
    occasion: route.entities.occasions[0] ?? previous.occasion,
    climate: route.entities.climates[0] ?? previous.climate,
    season: route.entities.seasons[0] ?? previous.season,
    intensityPreference: intensity,
    sampleFirst: /sample first|sample-first|can i sample|has? samples?/i.test(message) ? true : previous.sampleFirst,
  }
  const constraints = [
    next.preferredNotes.length ? `likes ${next.preferredNotes.join(", ")}` : null,
    next.excludedNotes.length ? `avoids ${next.excludedNotes.join(", ")}` : null,
    next.budgetMaxNGN ? `budget up to NGN ${next.budgetMaxNGN}` : null,
    next.occasion ? `occasion ${next.occasion}` : null,
    next.climate ? `climate ${next.climate}` : null,
    next.intensityPreference ? `intensity ${next.intensityPreference}` : null,
    next.sampleFirst ? "prefers samples first" : null,
  ].filter(Boolean)
  return { ...next, summary: constraints.length ? `Current preferences: ${constraints.join("; ")}.` : previous.summary }
}

export function boundedContext(messages: Array<{ role: string; content: string }>, state: ConciergeConversationState) {
  return {
    state,
    recentMessages: messages.slice(-10).map((message) => ({ role: message.role, content: message.content.slice(0, 2000) })),
  }
}

import { EMPTY_CONVERSATION_STATE, type ConciergeConversationState, type ConciergeIntentResult } from "./types"

const unique = (values: string[]) => [...new Set(values.map((v) => v.toLowerCase().trim()).filter(Boolean))].slice(0, 20)

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
  return {
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
    sampleFirst: /sample first|sample-first/i.test(message) ? true : previous.sampleFirst,
  }
}

export function boundedContext(messages: Array<{ role: string; content: string }>, state: ConciergeConversationState) {
  return {
    state,
    recentMessages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
  }
}

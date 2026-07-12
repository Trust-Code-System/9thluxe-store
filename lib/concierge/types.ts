export type ConciergeIntent =
  | "GENERAL_PERFUME_KNOWLEDGE"
  | "NOTE_EXPLANATION"
  | "ACCORD_EXPLANATION"
  | "INGREDIENT_RESEARCH"
  | "CATALOGUE_RECOMMENDATION"
  | "GLOBAL_RECOMMENDATION"
  | "AVAILABILITY_CHECK"
  | "PRICE_CHECK"
  | "PRODUCT_LOOKUP"
  | "PRODUCT_COMPARISON"
  | "SIMILAR_PERFUME"
  | "LAYERING"
  | "CLIMATE_GUIDANCE"
  | "OCCASION_GUIDANCE"
  | "GIFT_GUIDANCE"
  | "PERFORMANCE_QUESTION"
  | "REVIEW_RESEARCH"
  | "PERFUME_HISTORY"
  | "BRAND_OR_PERFUMER_RESEARCH"
  | "STORAGE_AND_CARE"
  | "SAMPLING_GUIDANCE"
  | "ORDER_OR_STORE_SUPPORT"
  | "MEDICAL_OR_ALLERGY_SENSITIVE"
  | "OUT_OF_SCOPE"

export interface ConciergeEntities {
  perfumeNames: string[]
  brands: string[]
  notes: string[]
  accords: string[]
  families: string[]
  occasions: string[]
  climates: string[]
  seasons: string[]
  budgetMaxNGN?: number
  budgetMinNGN?: number
}

export interface ConciergeIntentResult {
  primaryIntent: ConciergeIntent
  secondaryIntents: ConciergeIntent[]
  requiresCatalogue: boolean
  requiresLiveStock: boolean
  requiresWebResearch: boolean
  requiresConversationContext: boolean
  requiresClarification: boolean
  clarificationQuestion?: string
  entities: ConciergeEntities
  confidence: number
}

export interface ConciergeConversationState {
  lastIntent?: ConciergeIntent
  activeProductIds: string[]
  externalPerfumes: Array<{ name: string; brand?: string }>
  preferredNotes: string[]
  excludedNotes: string[]
  preferredFamilies: string[]
  budgetMaxNGN?: number
  occasion?: string
  climate?: string
  season?: string
  intensityPreference?: string
  sampleFirst?: boolean
  summary?: string
}

export type EvidenceScope = "FADE_CATALOGUE" | "APPROVED_KNOWLEDGE" | "CURRENT_WEB"

export interface ConciergeSource {
  id: string
  title: string
  url: string
  domain: string
  kind: "official" | "editorial" | "technical" | "retailer" | "community"
  retrievedAt: string
}

export interface ConciergeProductCard {
  id: string
  slug: string
  name: string
  brand: string | null
  image: string
  priceNGN: number
  availability: "in_stock" | "preorder" | "waitlist" | "out_of_stock"
  variantLabel?: string
  sampleAvailable: boolean
  reasons: string[]
  provenance: "Fádé catalogue"
}

export interface ConciergeEvidence {
  scope: EvidenceScope
  title: string
  content: string
  provenance: string
  retrievedAt: string
}

export interface ConciergeTurnResult {
  conversationId: string
  messageId?: string
  answer: string
  intent: ConciergeIntentResult
  products: ConciergeProductCard[]
  sources: ConciergeSource[]
  evidenceScopes: EvidenceScope[]
  provider?: string
  model?: string
  usage: { inputTokens: number; outputTokens: number; searchCalls: number; toolCalls: string[] }
  state: ConciergeConversationState
}

export interface ConciergeIdentity {
  userId?: string
  guestKeyHash?: string
  isAuthenticated: boolean
}

export const EMPTY_CONVERSATION_STATE: ConciergeConversationState = {
  activeProductIds: [],
  externalPerfumes: [],
  preferredNotes: [],
  excludedNotes: [],
  preferredFamilies: [],
}

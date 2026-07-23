import type { ConciergeIntent, ConciergeIntentResult, ConciergeConversationState } from "./types"

const NOTE_TERMS = [
  "aldehyde", "amber", "bergamot", "cedar", "citrus", "grape", "guaiac", "jasmine",
  "musk", "oud", "rose", "saffron", "sandalwood", "tobacco", "vanilla", "vetiver", "wood",
]
const ACCORD_TERMS = ["ambery", "aquatic", "aromatic", "earthy", "fruity", "green", "marine", "powdery", "smoky", "spicy", "sweet", "woody"]
const FAMILIES = ["amber", "aromatic", "chypre", "citrus", "floral", "fresh", "gourmand", "leather", "woody"]
const OCCASIONS = ["office", "work", "wedding", "evening", "night", "formal", "casual", "gift"]
const CLIMATES = ["hot", "humid", "rainy", "cold", "warm", "dry"]
const SEASONS = ["rainy season", "summer", "winter", "spring", "autumn", "fall"]

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value))
}

function pickIntent(text: string): ConciergeIntent {
  if (/(headache|allerg|irritated skin|pregnan|cure|medical|safe for skin|natural.*safer)/i.test(text)) return "MEDICAL_OR_ALLERGY_SENSITIVE"
  if (/(store perfume|perfume be stored|keep perfume|storage|expire|shelf life)/i.test(text)) return "STORAGE_AND_CARE"
  if (/(order|delivery|refund|return|payment|store|contact|shipping)/i.test(text)) return "ORDER_OR_STORE_SUPPORT"
  if (/(in stock|available(?: now| perfume| fragrance)?|availability|which one is available)/i.test(text)) return "AVAILABILITY_CHECK"
  if (/(cheaper|less expensive|lower budget|more affordable)/i.test(text) && !/alternative/i.test(text)) return "PRICE_CHECK"
  if (/(price|cost|how much|under\s*[₦n]?\s*\d|budget)/i.test(text)) return "PRICE_CHECK"
  if (includesAny(text, NOTE_TERMS) && /(what happens|what does|what kind|how (?:does|do).*(?:smell|interact)|smells? like)/i.test(text)) return "NOTE_EXPLANATION"
  if (/(layer|mix together|pair with|work together)/i.test(text)) return "LAYERING"
  if (/(edp.*edt|edt.*edp|top,? heart and base|skin.*different)/i.test(text)) return "GENERAL_PERFUME_KNOWLEDGE"
  if (/(what (?:is|does)|what does.*mean|difference between).*(accord|aldehyd|amber|maceration|oud.*cedar)|amber.*real ingredient/i.test(text)) return "ACCORD_EXPLANATION"
  if (/(compare|difference between|which is better|versus|\bvs\b)/i.test(text)) return "PRODUCT_COMPARISON"
  if (/(similar|closest|alternative|substitute)/i.test(text)) return "SIMILAR_PERFUME"
  if (/(review|people say|wearers say|popular|opinion)/i.test(text)) return "REVIEW_RESEARCH"
  if (/(who created|perfumer|launch year|reformulat|history|when.*released)/i.test(text)) return "PERFUME_HISTORY"
  if (/(brand|house|perfumer)/i.test(text)) return "BRAND_OR_PERFUMER_RESEARCH"
  if (/(sample|discovery set|test a fragrance|try first)/i.test(text)) return "SAMPLING_GUIDANCE"
  if (/(projection|sillage|longevity|last longer|performance)/i.test(text)) return "PERFORMANCE_QUESTION"
  if (/(rainy|hot weather|humid|cold weather|climate|season|lagos)/i.test(text)) return "CLIMATE_GUIDANCE"
  if (/(office|work|wedding|evening|night event|occasion|formal|casual)/i.test(text)) return "OCCASION_GUIDANCE"
  if (/(gift|present for)/i.test(text)) return "GIFT_GUIDANCE"
  if (includesAny(text, NOTE_TERMS) && /(what|how|smell|add|combined|together)/i.test(text)) return "NOTE_EXPLANATION"
  if (/(ingredient|raw material|natural|synthetic|molecule)/i.test(text)) return "INGREDIENT_RESEARCH"
  if (/(which fádé|which fàdé|which fàdè|which fade|show me|show only|recommend|what perfume|find me|currently available)/i.test(text)) return "CATALOGUE_RECOMMENDATION"
  if (/(recommend|what perfume|best perfume)/i.test(text)) return "GLOBAL_RECOMMENDATION"
  if (/(perfume|fragrance|scent|edt|edp|parfum|maceration|top notes|heart notes|base notes)/i.test(text)) return "GENERAL_PERFUME_KNOWLEDGE"
  return "OUT_OF_SCOPE"
}

export function routeConciergeIntent(message: string, state?: ConciergeConversationState): ConciergeIntentResult {
  const text = message.trim().toLowerCase()
  const comparison = message.trim().match(/compare\s+(.+?)\s+(?:and|versus|vs\.?)\s+(.+?)[?.!]?$/i)
  let primaryIntent = pickIntent(text)
  const followUp = /^(which|what about|does it|does that|show me|only|remove|can i|would it|and |the (?:first|second|third)|that one)/i.test(text)
    || /\b(?:that|those|them|it|one|ones|first|second|third|cheaper|alternative)\b/i.test(text)
  if (followUp && state?.lastIntent && primaryIntent === "OUT_OF_SCOPE") primaryIntent = state.lastIntent
  const notes = NOTE_TERMS.filter((term) => new RegExp(`\\b${term}s?\\b`, "i").test(text))
  const budget = text.match(/(?:₦|ngn|n)?\s*([0-9][0-9,]{3,})/i)?.[1]
  const explicitFade = /fádé|fàdé|fàdè|fade|catalogue|in stock|available|show me|which product/i.test(text)
  const requiresLiveStock = ["AVAILABILITY_CHECK", "CATALOGUE_RECOMMENDATION"].includes(primaryIntent) || /in stock|available now/i.test(text)
  const requiresCatalogue = explicitFade || requiresLiveStock || ["PRICE_CHECK", "PRODUCT_LOOKUP"].includes(primaryIntent) || Boolean(followUp && state?.activeProductIds.length)
  const currentResearch = ["REVIEW_RESEARCH", "PERFUME_HISTORY", "BRAND_OR_PERFUMER_RESEARCH"].includes(primaryIntent) || /current|latest|recent|reformulat|who created/i.test(text)
  const requiresWebResearch = currentResearch && !requiresCatalogue
  const secondaryIntents: ConciergeIntent[] = []
  if (includesAny(text, CLIMATES) && primaryIntent !== "CLIMATE_GUIDANCE") secondaryIntents.push("CLIMATE_GUIDANCE")
  if (includesAny(text, OCCASIONS) && primaryIntent !== "OCCASION_GUIDANCE") secondaryIntents.push("OCCASION_GUIDANCE")

  return {
    primaryIntent,
    secondaryIntents,
    requiresCatalogue,
    requiresLiveStock,
    requiresWebResearch,
    requiresConversationContext: followUp,
    requiresClarification: false,
    entities: {
      perfumeNames: comparison ? [comparison[1].trim(), comparison[2].trim()] : [], brands: [], notes,
      accords: ACCORD_TERMS.filter((term) => new RegExp(`\\b${term}\\b`, "i").test(text)),
      families: FAMILIES.filter((x) => text.includes(x)),
      occasions: OCCASIONS.filter((x) => text.includes(x)),
      climates: CLIMATES.filter((x) => text.includes(x)),
      seasons: SEASONS.filter((x) => text.includes(x)),
      ...(budget ? { budgetMaxNGN: Number(budget.replaceAll(",", "")) } : {}),
    },
    confidence: primaryIntent === "OUT_OF_SCOPE" ? 0.55 : followUp ? 0.76 : 0.9,
  }
}

// lib/analytics/pdp-events.ts
// CLIENT-side typed analytics dispatcher for the product-detail + discovery experience.
//
// Privacy: this dispatcher NEVER forwards raw Fragrance-DNA answers or full AI conversations to any
// third-party sink. Only coarse, non-sensitive signals (that an interaction happened, ids, counts)
// leave the page. Payloads are shallow-sanitised before dispatch.
//
// It is a safe no-op when no sink is present, so instrumentation can never break the page.

export type PdpEventName =
  | "product_viewed"
  | "media_viewed"
  | "video_played"
  | "size_selected"
  | "sample_selected"
  | "added_to_cart"
  | "buy_now_selected"
  | "wishlist_changed"
  | "saved_to_wardrobe"
  | "comparison_started"
  | "comparison_completed"
  | "note_selected"
  | "accord_selected"
  | "ingredient_opened"
  | "review_filter_used"
  | "question_searched"
  | "question_submitted"
  | "ai_match_started"
  | "ai_match_completed"
  | "ai_recommendation_selected"
  | "layering_recommendation_selected"
  | "discovery_set_selected"

/** Keys that must never be forwarded to third-party analytics, even if accidentally passed in. */
const SENSITIVE_KEYS = new Set([
  "answers",
  "dnaAnswers",
  "conversation",
  "messages",
  "prompt",
  "reasoning",
  "likedNotes",
  "dislikedNotes",
  "email",
])

type Payload = Record<string, string | number | boolean | null | undefined>

function sanitize(payload: Payload): Payload {
  const out: Payload = {}
  for (const [k, v] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(k)) continue
    if (v === undefined) continue
    // Only allow primitive scalars through.
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v
    }
  }
  return out
}

interface DataLayerWindow extends Window {
  dataLayer?: unknown[]
}

/** Dispatch a typed PDP event. Safe no-op when no analytics sink is available. */
export function trackPdp(name: PdpEventName, payload: Payload = {}): void {
  if (typeof window === "undefined") return
  const clean = sanitize(payload)
  try {
    const w = window as DataLayerWindow
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: `pdp.${name}`, ...clean })
    }
    // Dev visibility only; never in production bundles' hot path beyond a guarded log.
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[analytics] pdp.${name}`, clean)
    }
  } catch {
    // Never let instrumentation throw into the UI.
  }
}

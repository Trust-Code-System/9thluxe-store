// lib/fragrance/types.ts
// Shared, framework-agnostic types for the visual scent-intelligence system. Pure data only, no
// Prisma, no React, so every layer (library, normalization, enrichment, admin API, PDP components)
// can import from one place and be unit-tested in isolation.

/** Broad olfactory family an ingredient belongs to. Drives default colour + art direction. */
export type IngredientFamily =
  | "citrus"
  | "floral"
  | "woody"
  | "amber"
  | "spicy"
  | "gourmand"
  | "green"
  | "fruity"
  | "aromatic"
  | "animalic"
  | "resinous"
  | "aquatic"
  | "powdery"
  | "smoky"

/** Where an ingredient image came from. Recorded so nothing untraceable reaches customers. */
export type ImageProvenance =
  | "internal_library" // approved, hand-curated internal asset
  | "licensed" // a licensed stock/partner asset (licence recorded)
  | "generated" // deterministically generated house art (no external model, no scraping)

/** Editorial review state for a library entry or an AI/inferred field. */
export type ApprovalStatus = "draft" | "pending_review" | "approved" | "rejected"

/** Provenance for any subjective / inferred product field. Mirrors the PDP Provenance vocabulary. */
export type FieldSource =
  | "brand" // supplied by the manufacturer / brand
  | "editorial" // written / curated by the Fádé team
  | "customer_aggregate" // aggregated from verified customer reviews
  | "inferred" // derived by the deterministic enrichment pipeline
  | "ai_model" // produced by an external AI model (credential-gated, optional)

/** Confidence band for an inferred / AI field. Low confidence surfaces "Requires manual review". */
export type ConfidenceLevel = "high" | "medium" | "low"

/** Human-facing prominence bands. NEVER presented as a chemical formulation percentage. */
export type ProminenceLabel = "very_prominent" | "prominent" | "moderate" | "soft" | "trace"

/** Metadata attached to every ingredient image so its origin and licence are always traceable. */
export interface IngredientImageMeta {
  provenance: ImageProvenance
  /** Licence identifier or short generation-method note. e.g. "CC0", "Partner-2026", "house-svg-v1". */
  licence: string
  /** Free-text about how a generated/licensed asset was produced or sourced. */
  sourceNote: string
  approval: ApprovalStatus
  /** ISO date the asset was last reviewed by a human. null when never reviewed. */
  lastReviewed: string | null
}

/** A single canonical ingredient in the reusable library. */
export interface Ingredient {
  id: string
  /** Lowercase canonical key used for matching and links (e.g. "oud"). Unique. */
  canonicalName: string
  /** Title-cased label shown to customers (e.g. "Oud"). */
  displayName: string
  /** Accepted alternative names that normalize to this ingredient (e.g. "oudh", "agarwood"). */
  altNames: string[]
  /** Known common misspellings that should still resolve here (e.g. "bergamont"). */
  misspellings: string[]
  family: IngredientFamily
  /** Short scent descriptor adjectives (e.g. ["woody", "smoky", "resinous"]). */
  descriptors: string[]
  /** One-line description for cards and tooltips. */
  shortDescription: string
  /** Fuller editorial description for the ingredient detail view. */
  longDescription: string
  /** Associated brand-safe colour (hex) used for the art + accents. */
  color: string
  /** Canonical names of related ingredients, for "related notes" exploration. */
  related: string[]
  /** Extra search keywords (not shown), improve admin search recall. */
  searchKeywords: string[]
  /** Default and (optional) mobile/cutout image descriptors. */
  image: IngredientImageMeta
  /** Accessible alt text describing the ingredient image, never decorative-only. */
  alt: string
  approval: ApprovalStatus
  lastReviewed: string | null
}

/** The three classic olfactory tiers plus "unspecified" for notes with no declared tier. */
export type NoteTier = "top" | "heart" | "base"

/** Outcome of matching one submitted note string against the library. */
export type MatchStatus = "matched" | "corrected" | "ambiguous" | "unknown"

export interface IngredientMatch {
  /** The raw string exactly as submitted. Never silently overwritten. */
  input: string
  status: MatchStatus
  /** The resolved ingredient when status is matched/corrected. null otherwise. */
  ingredient: Ingredient | null
  /** For "corrected": the canonical name we believe was intended. */
  suggestion: string | null
  /** For "ambiguous": the competing canonical names. */
  candidates: string[]
  confidence: ConfidenceLevel
}

/** A note placed on a tier, carrying its match result and (optional) prominence. */
export interface CompositionNote {
  tier: NoteTier
  match: IngredientMatch
  /** Perceived prominence within this composition. Editorial, never a formulation percentage. */
  prominence: ProminenceLabel
  /** Ordinal position within its tier (0 = listed first / strongest). */
  order: number
}

/** A ranked main accord with a perceived (not chemical) prominence value. */
export interface AccordProminence {
  name: string
  slug: string
  /** 1-based rank; 1 = most prominent. */
  rank: number
  label: ProminenceLabel
  /** 0..100 perceived-prominence score for optional numeric display. NOT a formulation percentage. */
  score: number
  color: string
}

/** One stage of the scent-development timeline. */
export interface TimelineStage {
  key: "opening" | "early_heart" | "main_heart" | "dry_down" | "late_dry_down"
  label: string
  window: string
  notes: string[]
  impression: string
  /** 0..1 relative intensity for the mini-curve. Editorial, not measured. */
  intensity: number
}

/** Which visual template renders the composition hero. */
export type TemplateId =
  | "vertical_note" // ingredients stacked above the bottle
  | "ingredient_environment" // bottle centred, ingredients surrounding
  | "accord_spotlight" // cinematic, 3-5 dominant accords
  | "educational_grid" // clean per-ingredient cards (mobile / reduced-motion default)

/** A field that was inferred or AI-generated, with full provenance so nothing is misattributed. */
export interface SourcedField<T> {
  value: T
  source: FieldSource
  confidence: ConfidenceLevel
  /** ISO timestamp the value was generated. */
  generatedAt: string
  /** Model id or deterministic method name (e.g. "rule-based:v1", "claude-opus-4-8"). */
  method: string
  approval: ApprovalStatus
}

/** A non-blocking issue raised by the enrichment pipeline for admin review. */
export interface EnrichmentIssue {
  kind: "unknown_note" | "possible_misspelling" | "ambiguous_note" | "missing_accords" | "low_confidence"
  message: string
  /** The submitted value the issue concerns, when applicable. */
  subject: string | null
  /** A suggested correction the admin may accept or reject. Never auto-applied. */
  suggestion: string | null
}

/**
 * The complete, reviewable scent presentation for one product. Produced by the enrichment pipeline
 * and rendered by the PDP components. Everything here is derived from the product's real submitted
 * data, never invented; absent data yields empty arrays / null so sections hide gracefully.
 */
export interface ScentComposition {
  notes: CompositionNote[]
  accords: AccordProminence[]
  timeline: TimelineStage[]
  /** Distinct matched ingredients (deduped) for the gallery, in tier then order sequence. */
  gallery: CompositionNote[]
  /** Recommended template + the alternatives an admin may switch to. */
  recommendedTemplate: TemplateId
  /**
   * Admin-selected template override, when one has been saved for this product. null means "use the
   * recommendation". Populated by the loader from persistent storage; enrichment leaves it null.
   */
  selectedTemplate: TemplateId | null
  /** Plain-language, cautious explanation built only from approved fields. Lines may be null. */
  explanation: {
    summary: string | null
    opening: string | null
    heart: string | null
    dryDown: string | null
    mood: string | null
  }
  /** Inferred climate / occasion guidance tags (editorial), each with provenance. */
  climateTags: SourcedField<string[]>
  occasionTags: SourcedField<string[]>
  /** Issues for the admin review queue. Empty when everything resolved cleanly. */
  issues: EnrichmentIssue[]
  /** True when any field is low-confidence and the draft should show "Requires manual review". */
  requiresManualReview: boolean
  /** Overall data confidence, derived from match quality + field coverage. */
  confidence: ConfidenceLevel
  meta: {
    generatedAt: string
    method: string
  }
}

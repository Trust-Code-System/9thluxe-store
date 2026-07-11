// lib/hero/types.ts
// Typed contract for the homepage "Scent Atlas" hero. Pure data only (no Prisma, no React) so the
// server selector, the client scene and the tests can all import from one place. Nothing here is
// ever fabricated: every field is derived from a real, merchant-approved published product and the
// in-house approved ingredient-art library. Absent data yields null / empty arrays so sections hide
// gracefully rather than being filled with sample content.

import type { NoteTier, ProminenceLabel } from "@/lib/fragrance/types"

/** Why the hero resolved the way it did. Surfaced to logs / admin, never to customers. */
export type HeroApprovalStatus =
  | "approved" // a published, featured product with imagery resolved cleanly
  | "no_featured_product" // nothing is flagged for the homepage; render neutral placeholder
  | "missing_hero_image" // featured product exists but has no merchant-owned bottle image
  | "missing_ingredient_assets" // product resolved but no notes mapped to approved art

/** Availability posture shown discreetly next to the product. Derived from real commerce flags. */
export type HeroAvailability = "available" | "coming_soon"

/** One approved ingredient asset used as a falling object and in the note arrangement. */
export interface HeroIngredientAsset {
  /** Stable id (the ingredient canonical name) for React keys and connector anchors. */
  id: string
  /** Customer-facing note name exactly as it maps to the approved library (e.g. "Incense"). */
  name: string
  tier: NoteTier
  /** Deterministic in-house SVG data URI. No scraping, no external model, always available. */
  artDesktop: string
  artMobile: string
  /** Accessible description of the ingredient art (used only if ever surfaced non-decoratively). */
  alt: string
  /**
   * Perceived prominence within its tier, derived deterministically from listing order. This is an
   * editorial impression of how noticeable the note feels, NEVER a chemical formulation percentage.
   * Not rendered publicly in Stage 1; the annotation feature (Stage 2) consumes it.
   */
  perceivedProminence: ProminenceLabel
  /** Ordinal within its tier (0 = listed first). Drives fall order and arrangement position. */
  order: number
}

/** The real, merchant-approved product the hero presents. */
export interface HeroFeaturedProduct {
  id: string
  name: string
  slug: string
  /** Brand/house, when the merchant recorded one. Empty string when unknown (never invented). */
  brand: string
  /** Merchant-owned product image (first catalogue image). Required for a product hero. */
  image: string
  /** Meaningful product alt text for assistive technology. */
  alt: string
  /** Concentration label (EDP/EDT/...) when recorded, else null. */
  concentration: string | null
  availability: HeroAvailability
}

/** Notes grouped by tier for the final composition. Empty tiers are omitted by the renderer. */
export interface HeroNoteArrangement {
  top: HeroIngredientAsset[]
  heart: HeroIngredientAsset[]
  base: HeroIngredientAsset[]
}

/** Tunables for the animated scene. Kept data-driven so mobile can reduce density declaratively. */
export interface HeroMotionProfile {
  /** Loop length in ms (approx 11s per the creative direction). */
  loopMs: number
  /** Max simultaneous falling objects on desktop. */
  desktopParticles: number
  /** Max simultaneous falling objects on mobile (>=60% reduction). */
  mobileParticles: number
  /** Slow pedestal rotation sweep in degrees. */
  pedestalRotationDeg: number
}

/**
 * The fully resolved, public-safe hero payload. `null` from the selector means "no approved featured
 * product" and the homepage renders an honest neutral placeholder (no fictional bottle, no invented
 * perfume information).
 */
export interface HeroData {
  product: HeroFeaturedProduct
  /** Flat list of approved falling ingredients (deduped), in tier then order sequence. */
  ingredients: HeroIngredientAsset[]
  arrangement: HeroNoteArrangement
  motion: HeroMotionProfile
  status: HeroApprovalStatus
}

/**
 * Scent-annotation contract consumed by the Stage 2 typewriter/connector feature. Defined now so the
 * data shape is stable. Only APPROVED annotations whose ingredient asset is approved and whose note
 * exists in the approved product data may ever render publicly.
 */
export interface HeroScentAnnotation {
  id: string
  ingredientAssetId: string
  approvedNoteName: string
  noteLayer: "TOP" | "HEART" | "BASE"
  approvedContributionText: string
  perceivedProminence: "TRACE" | "SUBTLE" | "NOTICEABLE" | "PROMINENT" | "DOMINANT"
  displayOrder: number
  connectorAnchor: string
  motionProfile: string
  approvalStatus: "DRAFT" | "APPROVED" | "REJECTED"
}

/** Default motion profile. Tuned to the ~11s cinematic loop in the creative direction. */
export const DEFAULT_HERO_MOTION: HeroMotionProfile = {
  loopMs: 11_000,
  desktopParticles: 7,
  mobileParticles: 3,
  pedestalRotationDeg: 14,
}

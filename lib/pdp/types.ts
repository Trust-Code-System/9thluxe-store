// lib/pdp/types.ts
// Typed frontend view model for the product-detail + discovery experience. This is the
// frontend-owned integration boundary: `lib/pdp/loader.ts` assembles it from real backend data
// (Prisma today; the widened CommerceProduct DTO tomorrow; see docs/PDP_BACKEND_REQUIREMENTS.md).
//
// Every field is designed so a section can decide, purely from the data, whether it has anything
// meaningful to show. Absent data is `null`/`[]`, never a fabricated placeholder.

import type { ScentComposition } from "@/lib/fragrance/types"

/** Where a subjective/attribute value came from. Rendered as a truthful provenance chip. */
export type Provenance = "BRAND" | "EDITORIAL" | "CUSTOMER_AGGREGATE"

export interface Sourced<T> {
  value: T
  source: Provenance
  /** For CUSTOMER_AGGREGATE: how many verified reviews contributed. */
  sampleSize?: number
}

export interface PdpMedia {
  url: string
  kind: "image" | "video"
  alt: string | null
  position: number
}

export interface PdpVariant {
  id: string
  size: string | null
  sku: string | null
  priceNGN: number
  compareAtNGN: number | null
  /** Derived from a parseable size ("100ml" -> price/ml). null when not derivable. */
  pricePerMl: number | null
  isSample: boolean
  inStock: boolean
  stock: number | null
}

export interface PdpNote {
  name: string
  /** slug used for /shop?note= exploration links */
  slug: string
}

export interface PdpAccord {
  name: string
  slug: string
  /** 1-based rank; 1 = strongest. Used for proportional (not fabricated-percentage) bars. */
  rank: number
  /** Proportional strength 0..1 derived from rank, NOT a claimed lab percentage. */
  strength: number
}

export interface PdpTimelineStage {
  key: "open" | "early" | "mid" | "dry"
  label: string
  window: string
  notes: string[]
  impression: string
  /** relative 0..1 intensity for the mini-curve; editorial, not measured. */
  intensity: number
}

export interface PdpPerformanceMetric {
  key: string
  label: string
  definition: string
  /** 0..5 aggregate; null when not enough real data. */
  score: number | null
  /** number of verified reviews contributing to this score. */
  count: number
}

export interface PdpReviewSummary {
  ratingAvg: number
  ratingCount: number
  /** star -> count, real distribution from approved reviews. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  verifiedCount: number
  verifiedPct: number | null
  /** aggregated structured sub-scores (server-side; see backend R4). */
  longevity: PdpPerformanceMetric
  sillage: PdpPerformanceMetric
  value: PdpPerformanceMetric
  climateHistogram: Record<string, number>
  occasionHistogram: Record<string, number>
  imageCount: number
}

export interface PdpReview {
  id: string
  rating: number
  comment: string | null
  displayName: string | null
  verifiedPurchase: boolean
  longevityRating: number | null
  sillageRating: number | null
  valueRating: number | null
  climate: string | null
  occasion: string | null
  createdAt: string
}

export interface PdpProfileFacet {
  label: string
  value: string
  source: Provenance
  /** lucide icon name-agnostic; the component maps its own icon. */
  icon: string
}

export interface PdpBrand {
  name: string
  slug: string
  story: string | null
  country: string | null
  otherProducts: PdpCard[]
}

export interface PdpPerfumer {
  name: string
  bio: string | null
  otherProducts: PdpCard[]
}

/** Compact card shape reused by recommendations, brand grid, compare, recently-viewed. */
export interface PdpCard {
  id: string
  slug: string
  name: string
  brand: string | null
  concentration: string | null
  priceNGN: number
  compareAtNGN: number | null
  image: string | null
  ratingAvg: number
  ratingCount: number
  fragranceFamily: string | null
  notes: string[]
  hasSample: boolean
  availability: "in_stock" | "preorder" | "waitlist" | "out_of_stock"
  /** optional short match explanation for recommendation contexts. */
  reason?: string
}

export interface PdpRecommendationGroup {
  key: string
  title: string
  blurb: string
  items: PdpCard[]
}

export type StockState = "in_stock" | "low_stock" | "out_of_stock" | "preorder" | "waitlist"

export interface PdpData {
  // identity
  id: string
  slug: string
  name: string
  brand: string | null
  brandSlug: string | null
  description: string
  longDescription: string | null
  story: string | null
  olfactoryDesc: string | null
  concentration: string | null
  fragranceFamily: string | null

  // media
  media: PdpMedia[]

  // commerce
  currency: string
  basePriceNGN: number
  baseCompareAtNGN: number | null
  variants: PdpVariant[]
  hasSample: boolean
  stock: number
  stockState: StockState
  returnEligible: boolean
  isPreorder: boolean
  isWaitlist: boolean

  // social proof
  ratingAvg: number
  ratingCount: number

  // fragrance profile
  profileFacets: PdpProfileFacet[]
  notesTop: PdpNote[]
  notesHeart: PdpNote[]
  notesBase: PdpNote[]
  accords: PdpAccord[]
  moodTags: string[]

  /**
   * Full visual scent-intelligence composition (matched ingredients, perceived prominence, timeline,
   * template recommendation). Built from the product's real notes by the enrichment pipeline. null
   * when the product has no note data at all, so the composition sections hide gracefully.
   */
  composition: ScentComposition | null

  // subjective performance (labelled, editorial/aggregate)
  performance: PdpPerformanceMetric[]

  // derived editorial content
  timeline: PdpTimelineStage[]
  scentStory: {
    summary: string | null
    opening: string | null
    heart: string | null
    dryDown: string | null
    mood: string | null
  }

  // trust
  authenticity: {
    status: "RETAILER_INSPECTED" | "MANUFACTURER_VERIFIED"
    batchInfo: string | null
    lastVerifiedAt: string | null
  }

  // reviews (aggregate loaded server-side; list loaded client-side lazily)
  reviewSummary: PdpReviewSummary | null

  // relations
  brandProfile: PdpBrand | null
  perfumer: PdpPerfumer | null
  recommendationSeed: {
    family: string | null
    notes: string[]
    occasion: string | null
    climate: string | null
    priceNGN: number
  }

  // seo
  seo: {
    title: string
    description: string
    canonical: string | null
  }
}

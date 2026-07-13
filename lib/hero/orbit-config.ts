// lib/hero/orbit-config.ts
// Curated slide configuration for the homepage orbital carousel (Stage 2).
//
// A slide is one of two kinds:
//   1. PRODUCT slide - `display` omitted. Ties to a REAL published catalogue product (verified live
//      by the selector) and is fully purchasable (Explore + Shop actions).
//   2. SHOWCASE slide - `display` present. A non-purchasable editorial piece driven entirely by this
//      config: a recognisable fragrance the store presents as part of the site's world but does NOT
//      sell through checkout. It renders with NO buy action, needs no catalogue product, price or
//      stock, and never implies availability. Bottle image + notes are real; nothing is fabricated.
//
// Two gates must both be open before anything renders publicly:
//   1. the `hero_orbit` feature flag (default OFF) - flipping it on is the merchant's sign-off;
//   2. per-slide `approvalStatus === "APPROVED" && enabled`.

export type PedestalStyle = "STONE" | "METAL" | "GLASS" | "WATER"
export type SlideApprovalStatus = "DRAFT" | "APPROVED" | "REJECTED"

/** Editorial display data for a SHOWCASE slide (not for sale). All fields are real and approved. */
export interface OrbitSlideDisplay {
  brand: string
  name: string
  /** e.g. WOODY | FRESH | SPICY - shown as a small family label, never a purchase claim. */
  fragranceFamily: string
  concentration: string | null
  /** Comma-separated note names; only those in the approved ingredient library become visuals. */
  notesTop: string
  notesHeart: string
  notesBase: string
}

export interface HomepagePerfumeSlide {
  id: string
  /** Stable slug. For PRODUCT slides the selector re-verifies a PUBLISHED product with this slug. */
  productSlug: string
  displayOrder: number
  /**
   * Transparent bottle cutout under /public (background removed, unrecoloured, proportions intact).
   * `null` means no usable asset exists yet and the slide can never render.
   */
  bottleAsset: string | null
  pedestalStyle: PedestalStyle
  backgroundProfile: "night-adaptive"
  motionProfile: "calm-orbit"
  approvalStatus: SlideApprovalStatus
  enabled: boolean
  /** Present => SHOWCASE slide (not purchasable, config-driven). Absent => real PRODUCT slide. */
  display?: OrbitSlideDisplay
}

export const ORBIT_SLIDES: HomepagePerfumeSlide[] = [
  {
    // House signature oriental (oud/amber/vanilla): real, purchasable, front/default slide.
    id: "slide_nocturne",
    productSlug: "nocturne-eau-de-parfum",
    displayOrder: 1,
    bottleAsset: "/hero/nocturne-bottle.webp",
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "APPROVED",
    enabled: true,
  },
  {
    // Floral chapter (pink pepper/rose/patchouli): real, purchasable.
    id: "slide_vesper_velvet",
    productSlug: "vesper-velvet-eau-de-parfum",
    displayOrder: 2,
    bottleAsset: "/hero/vesper-velvet-bottle.webp",
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "APPROVED",
    enabled: true,
  },
  {
    // BLOCKED: the catalogue image for this product depicts a third-party (Terre d'Hermes) bottle,
    // which may not be presented as Aurelius Noir. Stays DRAFT/disabled with no asset until the
    // merchant supplies a correct, licensed bottle image. See the research proposal, slide 1.
    id: "slide_aurelius_noir",
    productSlug: "aurelius-noir-eau-de-toilette",
    displayOrder: 3,
    bottleAsset: null,
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "DRAFT",
    enabled: false,
  },

  // ---- Showcase round (see HERO_ORBIT_RESEARCH_PROPOSAL.md, "Expansion round") ----
  // Recognisable fragrances shown as part of the site's world, NOT sold through checkout. Merchant
  // supplied the bottle images (background-removed to transparent WebP); notes verified against
  // official/public sources. No price, stock or catalogue product - purely presentational.
  {
    id: "slide_tf_oud_wood",
    productSlug: "tom-ford-oud-wood",
    displayOrder: 4,
    bottleAsset: "/hero/tom-ford-oud-wood-bottle.webp",
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "APPROVED",
    enabled: true,
    display: {
      brand: "Tom Ford",
      name: "Oud Wood Eau de Parfum",
      fragranceFamily: "WOODY",
      concentration: "EDP",
      notesTop: "rosewood, cardamom",
      notesHeart: "oud, sandalwood, vetiver",
      notesBase: "tonka bean, vanilla, amber",
    },
  },
  {
    id: "slide_creed_aventus",
    productSlug: "creed-aventus",
    displayOrder: 5,
    bottleAsset: "/hero/creed-aventus-bottle.webp",
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "APPROVED",
    enabled: true,
    display: {
      brand: "Creed",
      name: "Aventus Eau de Parfum",
      fragranceFamily: "FRESH",
      concentration: "EDP",
      notesTop: "bergamot, blackcurrant, apple, pineapple",
      notesHeart: "birch, patchouli, jasmine",
      notesBase: "musk, oakmoss, ambergris, vanilla",
    },
  },
  {
    id: "slide_dior_sauvage_elixir",
    productSlug: "dior-sauvage-elixir",
    displayOrder: 6,
    bottleAsset: "/hero/dior-sauvage-elixir-bottle.webp",
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "APPROVED",
    enabled: true,
    display: {
      brand: "Dior",
      name: "Sauvage Elixir",
      fragranceFamily: "SPICY",
      concentration: "Elixir",
      notesTop: "grapefruit, cinnamon, nutmeg, cardamom",
      notesHeart: "lavender",
      notesBase: "licorice, sandalwood, amber, patchouli, vetiver",
    },
  },
]

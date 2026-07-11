// lib/hero/select.ts
// Server-side selection of the homepage hero fragrance. The hero requires EXPLICIT merchant approval:
// a product must be PUBLISHED, not soft-deleted, flagged isFeatured, and carry a merchant-owned image.
// If nothing qualifies the selector returns null and the homepage renders an honest neutral
// placeholder. Notes are mapped through the approved in-house ingredient library; only notes that
// resolve to an approved asset become falling objects. Nothing is invented or inferred from the name.

import { prisma } from "@/lib/prisma"
import { matchIngredient } from "@/lib/fragrance/normalize"
import { ingredientArtDataUri } from "@/lib/fragrance/art"
import type { NoteTier, ProminenceLabel } from "@/lib/fragrance/types"
import {
  DEFAULT_HERO_MOTION,
  type HeroData,
  type HeroIngredientAsset,
  type HeroNoteArrangement,
} from "./types"

/** The minimal product shape the selector needs. Kept explicit so buildHeroData is pure + testable. */
export interface HeroProductInput {
  id: string
  name: string
  slug: string
  brand: string | null
  images: unknown
  notesTop: string | null
  notesHeart: string | null
  notesBase: string | null
  concentration: string | null
  publishStatus: string
  deletedAt: Date | null
  isFeatured: boolean
  stock: number
  isPreorder: boolean
  isWaitlist: boolean
  dropDate: Date | null
}

/** Perceived-prominence band by position within a tier. Editorial impression, never a percentage. */
const PROMINENCE_BY_ORDER: ProminenceLabel[] = [
  "very_prominent",
  "prominent",
  "moderate",
  "soft",
  "trace",
]

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images.find((v) => typeof v === "string" && v.trim().length > 0)
  return typeof first === "string" ? first : null
}

function splitNotes(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Map one tier's raw note strings to approved ingredient assets, preserving listing order. */
export function assetsForTier(raw: string | null, tier: NoteTier): HeroIngredientAsset[] {
  const assets: HeroIngredientAsset[] = []
  const seen = new Set<string>()
  splitNotes(raw).forEach((noteText, index) => {
    const match = matchIngredient(noteText)
    const ing = match.ingredient
    // Only approved library ingredients with a resolvable match become public falling objects.
    if (!ing) return
    if (match.status !== "matched" && match.status !== "corrected") return
    if (seen.has(ing.canonicalName)) return
    seen.add(ing.canonicalName)
    assets.push({
      id: ing.canonicalName,
      name: ing.displayName,
      tier,
      artDesktop: ingredientArtDataUri(ing, { size: 160 }),
      artMobile: ingredientArtDataUri(ing, { size: 96 }),
      alt: ing.alt,
      perceivedProminence:
        PROMINENCE_BY_ORDER[Math.min(index, PROMINENCE_BY_ORDER.length - 1)],
      order: index,
    })
  })
  return assets
}

/** Real commerce flags -> availability posture. Shared by the Stage 1 hero and the orbit slides. */
export function isComingSoon(
  product: Pick<HeroProductInput, "isPreorder" | "isWaitlist" | "stock" | "dropDate">,
): boolean {
  return (
    product.isPreorder ||
    product.isWaitlist ||
    product.stock <= 0 ||
    (product.dropDate != null && product.dropDate.getTime() > Date.now())
  )
}

/**
 * Build the public hero payload from a single candidate product, or null when the product is not
 * eligible (missing, unpublished, deleted, not featured, or has no merchant-owned image).
 */
export function buildHeroData(product: HeroProductInput | null): HeroData | null {
  if (!product) return null
  if (product.deletedAt) return null
  if (product.publishStatus !== "PUBLISHED") return null
  if (!product.isFeatured) return null

  const image = firstImage(product.images)
  if (!image) {
    // Merchant-owned bottle imagery is required for a product hero. Without it we fall back to the
    // neutral placeholder rather than invent a bottle. (Logged by the caller for the admin workflow.)
    return null
  }

  const top = assetsForTier(product.notesTop, "top")
  const heart = assetsForTier(product.notesHeart, "heart")
  const base = assetsForTier(product.notesBase, "base")
  const arrangement: HeroNoteArrangement = { top, heart, base }
  const ingredients = [...top, ...heart, ...base]

  const comingSoon = isComingSoon(product)

  const brand = (product.brand ?? "").trim()

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand,
      image,
      alt: `${product.name}${brand ? ` by ${brand}` : ""} perfume bottle`,
      concentration: product.concentration?.trim() || null,
      availability: comingSoon ? "coming_soon" : "available",
    },
    ingredients,
    arrangement,
    motion: DEFAULT_HERO_MOTION,
    status: ingredients.length > 0 ? "approved" : "missing_ingredient_assets",
  }
}

/**
 * Query the single merchant-approved featured product and resolve it to hero data. Best-effort: any
 * DB error yields null so the homepage still renders (with the neutral placeholder). Selecting the
 * most-recently-updated featured product lets an admin "revert" simply by re-featuring another.
 */
export async function selectHeroFeaturedProduct(): Promise<HeroData | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        deletedAt: null,
        publishStatus: "PUBLISHED",
        isFeatured: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    })
    return buildHeroData(product as HeroProductInput | null)
  } catch (err) {
    console.error("[hero] failed to select featured product", err)
    return null
  }
}

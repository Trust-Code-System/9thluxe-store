// lib/pdp/loader.ts
// SERVER-ONLY. Assembles the typed PdpData view model from real backend data (Prisma today). This is
// the frontend-owned integration boundary; it does not modify any backend contract file. Every
// value is real or null; nothing here fabricates commerce, review, or fragrance data.
import "server-only"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import {
  toNotes,
  toAccords,
  splitList,
  pricePerMl,
  stockState,
  buildTimeline,
  buildScentStory,
} from "./parse"
import { enrichComposition } from "@/lib/fragrance/enrich"
import { getProductTemplate } from "@/lib/fragrance/template-store"
import type {
  PdpData,
  PdpMedia,
  PdpVariant,
  PdpCard,
  PdpProfileFacet,
  PdpReviewSummary,
  PdpPerformanceMetric,
} from "./types"

type ProductRow = Prisma.ProductGetPayload<{
  include: { variants: true; media: true }
}>

function toCard(p: {
  id: string
  slug: string
  name: string
  brand: string | null
  concentration: string | null
  priceNGN: number
  oldPriceNGN: number | null
  images: Prisma.JsonValue
  ratingAvg: number
  ratingCount: number
  fragranceFamily: string | null
  notesTop: string | null
  notesHeart: string | null
  stock: number
  isPreorder: boolean
  isWaitlist: boolean
}): PdpCard {
  const imgs = Array.isArray(p.images) ? (p.images as string[]).filter((i) => typeof i === "string") : []
  const notes = [...splitList(p.notesTop), ...splitList(p.notesHeart)].slice(0, 4)
  const availability: PdpCard["availability"] =
    p.stock > 0 ? "in_stock" : p.isPreorder ? "preorder" : p.isWaitlist ? "waitlist" : "out_of_stock"
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    concentration: p.concentration,
    priceNGN: p.priceNGN,
    compareAtNGN: p.oldPriceNGN ?? null,
    image: imgs[0] ?? null,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    fragranceFamily: p.fragranceFamily,
    notes,
    hasSample: false,
    availability,
  }
}

const CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  concentration: true,
  priceNGN: true,
  oldPriceNGN: true,
  images: true,
  ratingAvg: true,
  ratingCount: true,
  fragranceFamily: true,
  notesTop: true,
  notesHeart: true,
  stock: true,
  isPreorder: true,
  isWaitlist: true,
} satisfies Prisma.ProductSelect

/** Parse a bottle size out of the product name ("… 100ml") as a fallback for the base variant. */
function sizeFromName(name: string): string | null {
  const m = name.match(/(\d+(?:\.\d+)?)\s*ml/i)
  return m ? `${m[1]}ml` : null
}

function buildVariants(p: ProductRow): PdpVariant[] {
  if (p.variants && p.variants.length > 0) {
    return p.variants
      .slice()
      .sort((a, b) => Number(a.isSample) - Number(b.isSample) || a.priceNGN - b.priceNGN)
      .map((v) => ({
        id: v.id,
        size: v.size,
        sku: v.sku,
        priceNGN: v.priceNGN,
        compareAtNGN: v.compareAtNGN ?? null,
        pricePerMl: pricePerMl(v.priceNGN, v.size),
        isSample: v.isSample,
        inStock: v.stock > 0,
        stock: v.stock,
      }))
  }
  // Fallback: the base product IS the full-bottle variant.
  const size = sizeFromName(p.name)
  return [
    {
      id: `${p.id}:base`,
      size,
      sku: p.sku ?? null,
      priceNGN: p.priceNGN,
      compareAtNGN: p.oldPriceNGN ?? null,
      pricePerMl: pricePerMl(p.priceNGN, size),
      isSample: false,
      inStock: p.stock > 0,
      stock: p.stock,
    },
  ]
}

function buildMedia(p: ProductRow): PdpMedia[] {
  if (p.media && p.media.length > 0) {
    return p.media
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        url: m.url,
        kind: m.kind === "video" ? "video" : "image",
        alt: m.alt,
        position: m.position,
      }))
  }
  const imgs = Array.isArray(p.images) ? (p.images as string[]).filter((i) => typeof i === "string") : []
  return imgs.map((url, i) => ({ url, kind: "image" as const, alt: null, position: i }))
}

function buildProfileFacets(p: ProductRow): PdpProfileFacet[] {
  const facets: PdpProfileFacet[] = []
  const add = (
    value: string | null | undefined,
    label: string,
    icon: string,
    source: PdpProfileFacet["source"],
  ) => {
    if (value && String(value).trim()) facets.push({ label, value: String(value).trim(), icon, source })
  }
  add(p.brand, "House", "building", "BRAND")
  add(p.perfumer, "Perfumer", "user", "BRAND")
  add(p.launchYear ? String(p.launchYear) : null, "Launch year", "calendar", "BRAND")
  add(p.countryOfOrigin, "Origin", "globe", "BRAND")
  add(p.concentration, "Concentration", "flask", "BRAND")
  add(p.fragranceFamily, "Family", "layers", "BRAND")
  add(p.season, "Season", "leaf", "EDITORIAL")
  add(p.climate, "Climate", "sun", "EDITORIAL")
  add(p.timeOfDay, "Time of day", "clock", "EDITORIAL")
  add(p.occasion, "Occasion", "sparkles", "EDITORIAL")
  add(p.longevity, "Longevity", "hourglass", "EDITORIAL")
  add(p.sillage, "Sillage", "wind", "EDITORIAL")
  add(p.intensity, "Intensity", "gauge", "EDITORIAL")
  if (p.beginnerFriendly) add("Beginner-friendly", "Suitability", "check", "EDITORIAL")
  return facets
}

interface ReviewAgg {
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  count: number
  verifiedCount: number
  longevity: { sum: number; n: number }
  sillage: { sum: number; n: number }
  value: { sum: number; n: number }
  climateHistogram: Record<string, number>
  occasionHistogram: Record<string, number>
  avg: number
}

async function loadReviewSummary(productId: string): Promise<PdpReviewSummary | null> {
  const rows = await prisma.review.findMany({
    where: { productId, approved: true },
    select: {
      rating: true,
      verifiedPurchase: true,
      longevityRating: true,
      sillageRating: true,
      valueRating: true,
      climate: true,
      occasion: true,
    },
  })
  if (rows.length === 0) return null

  const agg: ReviewAgg = {
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    count: 0,
    verifiedCount: 0,
    longevity: { sum: 0, n: 0 },
    sillage: { sum: 0, n: 0 },
    value: { sum: 0, n: 0 },
    climateHistogram: {},
    occasionHistogram: {},
    avg: 0,
  }
  let ratingSum = 0
  for (const r of rows) {
    const star = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5
    agg.distribution[star] += 1
    agg.count += 1
    ratingSum += r.rating
    if (r.verifiedPurchase) agg.verifiedCount += 1
    if (r.longevityRating != null) {
      agg.longevity.sum += r.longevityRating
      agg.longevity.n += 1
    }
    if (r.sillageRating != null) {
      agg.sillage.sum += r.sillageRating
      agg.sillage.n += 1
    }
    if (r.valueRating != null) {
      agg.value.sum += r.valueRating
      agg.value.n += 1
    }
    if (r.climate?.trim()) agg.climateHistogram[r.climate.trim()] = (agg.climateHistogram[r.climate.trim()] ?? 0) + 1
    if (r.occasion?.trim())
      agg.occasionHistogram[r.occasion.trim()] = (agg.occasionHistogram[r.occasion.trim()] ?? 0) + 1
  }
  agg.avg = agg.count ? Math.round((ratingSum / agg.count) * 10) / 10 : 0

  const metric = (
    key: string,
    label: string,
    definition: string,
    m: { sum: number; n: number },
  ): PdpPerformanceMetric => ({
    key,
    label,
    definition,
    score: m.n > 0 ? Math.round((m.sum / m.n) * 10) / 10 : null,
    count: m.n,
  })

  return {
    ratingAvg: agg.avg,
    ratingCount: agg.count,
    distribution: agg.distribution,
    verifiedCount: agg.verifiedCount,
    verifiedPct: agg.count ? Math.round((agg.verifiedCount / agg.count) * 100) : null,
    longevity: metric("longevity", "Longevity", "How long the fragrance lasts on skin.", agg.longevity),
    sillage: metric("sillage", "Projection / sillage", "How far the scent travels from the wearer.", agg.sillage),
    value: metric("value", "Value", "Perceived value for the price paid.", agg.value),
    climateHistogram: agg.climateHistogram,
    occasionHistogram: agg.occasionHistogram,
    imageCount: 0, // Review model has no image field yet; see backend R7-adjacent note.
  }
}

function buildPerformance(summary: PdpReviewSummary | null): PdpPerformanceMetric[] {
  if (!summary) return []
  return [summary.longevity, summary.sillage, summary.value].filter((m) => m.score != null)
}

export async function loadPdpData(slug: string): Promise<PdpData | null> {
  const p = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: { variants: true, media: true },
  })
  if (!p) return null

  const notesTop = toNotes(p.notesTop)
  const notesHeart = toNotes(p.notesHeart)
  const notesBase = toNotes(p.notesBase)
  const accords = toAccords(p.mainAccords)
  const moodTags = splitList(p.moodTags)
  const variants = buildVariants(p)

  // Visual scent-intelligence composition, derived purely from the product's real fragrance data.
  // Returns null when there are no notes at all, so the composition sections simply do not render.
  const hasAnyNotes = notesTop.length + notesHeart.length + notesBase.length > 0
  const composition = hasAnyNotes
    ? enrichComposition({
        top: notesTop.map((n) => n.name),
        heart: notesHeart.map((n) => n.name),
        base: notesBase.map((n) => n.name),
        accords: accords.map((a) => a.name),
        family: p.fragranceFamily,
        olfactoryDesc: p.olfactoryDesc,
        moods: moodTags,
        season: p.season,
        climate: p.climate,
        timeOfDay: p.timeOfDay,
        occasion: p.occasion,
      })
    : null
  // Apply the admin's saved template override, if any (resilient: null when unset or unavailable).
  if (composition) {
    composition.selectedTemplate = await getProductTemplate(p.id)
  }
  const hasSample = variants.some((v) => v.isSample && v.inStock)

  const [reviewSummary, brandOthers, perfumerOthers] = await Promise.all([
    loadReviewSummary(p.id),
    p.brand
      ? prisma.product.findMany({
          where: { brand: p.brand, deletedAt: null, publishStatus: "PUBLISHED", NOT: { id: p.id } },
          select: CARD_SELECT,
          take: 4,
          orderBy: { ratingAvg: "desc" },
        })
      : Promise.resolve([]),
    p.perfumer
      ? prisma.product.findMany({
          where: { perfumer: p.perfumer, deletedAt: null, publishStatus: "PUBLISHED", NOT: { id: p.id } },
          select: CARD_SELECT,
          take: 4,
          orderBy: { ratingAvg: "desc" },
        })
      : Promise.resolve([]),
  ])

  const brandCards: PdpCard[] = brandOthers.map(toCard)
  const perfumerCards: PdpCard[] = perfumerOthers.map(toCard)

  const state = stockState(p.stock, {
    isPreorder: p.isPreorder,
    isWaitlist: p.isWaitlist,
  })

  const data: PdpData = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    brandSlug: p.brand,
    description: p.description,
    longDescription: null, // no column; see backend R1
    story: null, // no column; see backend R1
    olfactoryDesc: p.olfactoryDesc,
    concentration: p.concentration,
    fragranceFamily: p.fragranceFamily,

    media: buildMedia(p),

    currency: p.currency,
    basePriceNGN: p.priceNGN,
    baseCompareAtNGN: p.oldPriceNGN ?? null,
    variants,
    hasSample,
    stock: p.stock,
    stockState: state,
    returnEligible: p.returnEligible,
    isPreorder: p.isPreorder,
    isWaitlist: p.isWaitlist,

    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,

    profileFacets: buildProfileFacets(p),
    notesTop,
    notesHeart,
    notesBase,
    accords,
    moodTags,
    composition,

    performance: buildPerformance(reviewSummary),

    timeline: buildTimeline(
      notesTop.map((n) => n.name),
      notesHeart.map((n) => n.name),
      notesBase.map((n) => n.name),
    ),
    scentStory: buildScentStory({
      olfactoryDesc: p.olfactoryDesc,
      family: p.fragranceFamily,
      top: notesTop.map((n) => n.name),
      heart: notesHeart.map((n) => n.name),
      base: notesBase.map((n) => n.name),
      moods: moodTags,
    }),

    authenticity: {
      status: p.authenticityStatus === "MANUFACTURER_VERIFIED" ? "MANUFACTURER_VERIFIED" : "RETAILER_INSPECTED",
      batchInfo: p.batchInfo,
      lastVerifiedAt: p.lastVerifiedAt ? p.lastVerifiedAt.toISOString() : null,
    },

    reviewSummary,

    brandProfile: p.brand
      ? {
          name: p.brand,
          slug: p.brand,
          story: null, // no brand story column; see backend R1
          country: p.countryOfOrigin,
          otherProducts: brandCards,
        }
      : null,
    perfumer: p.perfumer
      ? {
          name: p.perfumer,
          bio: null, // no perfumer bio column; never AI-invented; see backend R1
          otherProducts: perfumerCards,
        }
      : null,

    recommendationSeed: {
      family: p.fragranceFamily,
      notes: [...notesTop, ...notesHeart, ...notesBase].map((n) => n.name),
      occasion: p.occasion,
      climate: p.climate,
      priceNGN: p.priceNGN,
    },

    seo: {
      title: `${p.name}${p.brand ? ` · ${p.brand}` : ""} | Fàdè`,
      description: p.olfactoryDesc || p.description,
      canonical: null,
    },
  }

  return data
}

/** Lightweight related-products fetch for the recommendation rail (same family, in stock). */
export async function loadRelatedByFamily(
  family: string | null,
  excludeId: string,
  limit = 4,
): Promise<PdpCard[]> {
  const rows = await prisma.product.findMany({
    where: {
      deletedAt: null,
      publishStatus: "PUBLISHED",
      stock: { gt: 0 },
      NOT: { id: excludeId },
      ...(family ? { fragranceFamily: family } : {}),
    },
    select: CARD_SELECT,
    take: limit,
    orderBy: { ratingAvg: "desc" },
  })
  return rows.map(toCard)
}

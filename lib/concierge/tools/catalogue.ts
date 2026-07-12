import { z } from "zod"
import { prisma } from "@/lib/prisma"
import type { ConciergeConversationState, ConciergeEvidence, ConciergeProductCard } from "../types"

const SearchInput = z.object({
  query: z.string().max(200).optional(),
  notes: z.array(z.string().max(60)).max(12).default([]),
  budgetMaxNGN: z.number().int().positive().optional(),
  inStockOnly: z.boolean().default(false),
  sampleFirst: z.boolean().default(false),
  productIds: z.array(z.string()).max(20).default([]),
  limit: z.number().int().min(1).max(12).default(6),
})

export interface CatalogueToolResult {
  products: ConciergeProductCard[]
  evidence: ConciergeEvidence[]
  checkedAt: string
}

function imageFrom(value: unknown): string {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "/placeholder-flacon.svg"
}

export async function searchFadeCatalogue(raw: z.input<typeof SearchInput>): Promise<CatalogueToolResult> {
  const input = SearchInput.parse(raw)
  const and: Record<string, unknown>[] = [{ deletedAt: null }, { publishStatus: "PUBLISHED" }]
  if (input.productIds.length) and.push({ id: { in: input.productIds } })
  if (input.inStockOnly) and.push({ OR: [{ stock: { gt: 0 } }, { isPreorder: true }] })
  if (input.budgetMaxNGN) and.push({ priceNGN: { lte: input.budgetMaxNGN } })
  if (input.notes.length) {
    and.push({
      OR: input.notes.flatMap((note) => [
        { notesTop: { contains: note, mode: "insensitive" } },
        { notesHeart: { contains: note, mode: "insensitive" } },
        { notesBase: { contains: note, mode: "insensitive" } },
        { mainAccords: { contains: note, mode: "insensitive" } },
      ]),
    })
  }
  if (input.query && input.query.split(/\s+/).length <= 4) {
    and.push({ OR: [
      { name: { contains: input.query, mode: "insensitive" } },
      { brand: { contains: input.query, mode: "insensitive" } },
      { fragranceFamily: { contains: input.query, mode: "insensitive" } },
      { occasion: { contains: input.query, mode: "insensitive" } },
    ] })
  }

  let rows = await prisma.product.findMany({
    where: { AND: and as never },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }],
    take: input.limit,
    select: {
      id: true, slug: true, name: true, brand: true, images: true, priceNGN: true,
      stock: true, isPreorder: true, isWaitlist: true, notesTop: true, notesHeart: true,
      notesBase: true, mainAccords: true, fragranceFamily: true, olfactoryDesc: true,
      climate: true, occasion: true,
      variants: { where: { stock: { gt: 0 } }, select: { size: true, priceNGN: true, isSample: true, stock: true } },
    },
  })
  if (!rows.length && !input.productIds.length && (input.notes.length || input.query)) {
    rows = await prisma.product.findMany({
      where: { deletedAt: null, publishStatus: "PUBLISHED", ...(input.inStockOnly ? { OR: [{ stock: { gt: 0 } }, { isPreorder: true }] } : {}) },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }], take: input.limit,
      select: {
        id: true, slug: true, name: true, brand: true, images: true, priceNGN: true,
        stock: true, isPreorder: true, isWaitlist: true, notesTop: true, notesHeart: true,
        notesBase: true, mainAccords: true, fragranceFamily: true, olfactoryDesc: true,
        climate: true, occasion: true,
        variants: { where: { stock: { gt: 0 } }, select: { size: true, priceNGN: true, isSample: true, stock: true } },
      },
    })
  }
  const checkedAt = new Date().toISOString()
  const products = rows.map((row) => {
    const sample = row.variants.find((v) => v.isSample)
    const reasons = [
      row.mainAccords ? `Accords: ${row.mainAccords}` : null,
      row.olfactoryDesc ?? row.fragranceFamily,
    ].filter((x): x is string => Boolean(x)).slice(0, 2)
    return {
      id: row.id, slug: row.slug, name: row.name, brand: row.brand,
      image: imageFrom(row.images), priceNGN: sample && input.sampleFirst ? sample.priceNGN : row.priceNGN,
      availability: row.stock > 0 ? "in_stock" as const : row.isPreorder ? "preorder" as const : row.isWaitlist ? "waitlist" as const : "out_of_stock" as const,
      ...(sample?.size ? { variantLabel: sample.size } : {}), sampleAvailable: Boolean(sample), reasons,
      provenance: "Fádé catalogue" as const,
    }
  })
  const evidence = rows.map((row) => ({
    scope: "FADE_CATALOGUE" as const,
    title: `${row.brand ? `${row.brand} ` : ""}${row.name}`,
    content: [row.olfactoryDesc, row.mainAccords && `Accords: ${row.mainAccords}`, row.notesTop && `Top: ${row.notesTop}`, row.notesHeart && `Heart: ${row.notesHeart}`, row.notesBase && `Base: ${row.notesBase}`, row.climate && `Climate: ${row.climate}`, row.occasion && `Occasion: ${row.occasion}`].filter(Boolean).join("\n"),
    provenance: `Fádé catalogue, live price and availability checked ${checkedAt}`,
    retrievedAt: checkedAt,
  }))
  return { products, evidence, checkedAt }
}

export async function getFadeProduct(idOrSlug: string) {
  const input = z.string().min(1).max(160).parse(idOrSlug)
  return searchFadeCatalogue({ productIds: [input], limit: 1 }).then(async (result) => {
    if (result.products.length) return result
    const row = await prisma.product.findFirst({ where: { slug: input, deletedAt: null, publishStatus: "PUBLISHED" }, select: { id: true } })
    return row ? searchFadeCatalogue({ productIds: [row.id], limit: 1 }) : result
  })
}

export const getFadeProductsBatch = (ids: string[]) => searchFadeCatalogue({ productIds: ids, limit: Math.min(ids.length, 12) })
export const checkFadeAvailability = (ids: string[]) => searchFadeCatalogue({ productIds: ids, inStockOnly: true, limit: Math.min(ids.length, 12) })

export async function comparePerfumes(ids: string[]) {
  const result = await getFadeProductsBatch(ids)
  return {
    products: result.products,
    rows: result.products.map((product) => ({ id: product.id, name: product.name, priceNGN: product.priceNGN, availability: product.availability, sampleAvailable: product.sampleAvailable, reasons: product.reasons })),
    provenance: `Fádé catalogue checked ${result.checkedAt}`,
  }
}

export async function getProductVariants(productId: string) {
  const id = z.string().min(1).parse(productId)
  return prisma.productVariant.findMany({ where: { productId: id, product: { deletedAt: null, publishStatus: "PUBLISHED" } }, select: { id: true, size: true, priceNGN: true, isSample: true, stock: true } })
}

export async function findSimilarCatalogueProducts(state: ConciergeConversationState, limit = 6) {
  return searchFadeCatalogue({ notes: state.preferredNotes, budgetMaxNGN: state.budgetMaxNGN, inStockOnly: true, sampleFirst: state.sampleFirst, limit })
}

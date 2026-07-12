import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { matchIngredients } from "@/lib/fragrance/normalize"
import type { ConciergeEvidence } from "../types"

export async function searchApprovedPerfumeKnowledge(query: string, limit = 6): Promise<ConciergeEvidence[]> {
  const q = z.string().min(1).max(200).parse(query)
  const rows = await prisma.perfumeKnowledgeEntry.findMany({
    where: { approvalStatus: "APPROVED", OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] },
    take: Math.min(limit, 10), select: { title: true, content: true, category: true, lastVerifiedAt: true },
  })
  return rows.map((row) => ({ scope: "APPROVED_KNOWLEDGE", title: row.title, content: row.content, provenance: `Fádé approved ${row.category} reference`, retrievedAt: (row.lastVerifiedAt ?? new Date()).toISOString() }))
}

export async function getApprovedScentAtlas(productId: string): Promise<ConciergeEvidence[]> {
  const id = z.string().min(1).parse(productId)
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null, publishStatus: "PUBLISHED" },
    select: { name: true, notesTop: true, notesHeart: true, notesBase: true, mainAccords: true, olfactoryDesc: true, climate: true, season: true, occasion: true, updatedAt: true },
  })
  if (!product) return []
  const rawNotes = [product.notesTop, product.notesHeart, product.notesBase].filter(Boolean).join(",").split(",").map((x) => x.trim()).filter(Boolean)
  const approvedNotes = matchIngredients(rawNotes).filter((m) => m.status === "matched" && m.ingredient?.approval === "approved").map((m) => m.ingredient!.displayName)
  return [{
    scope: "FADE_CATALOGUE", title: `${product.name} approved scent data`,
    content: [product.olfactoryDesc, approvedNotes.length ? `Approved notes: ${approvedNotes.join(", ")}` : null, product.mainAccords && `Accords: ${product.mainAccords}`, product.climate && `Climate: ${product.climate}`, product.season && `Season: ${product.season}`, product.occasion && `Occasion: ${product.occasion}`].filter(Boolean).join("\n"),
    provenance: "Merchant-published product data and approved ingredient library. Prominence is perceptual, not a formulation percentage.",
    retrievedAt: product.updatedAt.toISOString(),
  }]
}

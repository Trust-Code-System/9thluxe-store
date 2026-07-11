import { prisma } from "@/lib/prisma"

export async function getUserScentProfile(userId: string | undefined) {
  if (!userId) return null
  return prisma.scentProfile.findUnique({ where: { userId }, select: { preferredFamilies: true, preferredNotes: true, dislikedNotes: true, intensity: true, longevity: true, budgetMaxNGN: true, occasion: true, climate: true } })
}

export async function getUserWishlist(userId: string | undefined) {
  if (!userId) return []
  return prisma.wishlist.findMany({ where: { userId, product: { deletedAt: null, publishStatus: "PUBLISHED" } }, take: 20, select: { productId: true } }).then((rows) => rows.map((r) => r.productId))
}

export async function getUserPastRecommendations(userId: string | undefined) {
  if (!userId) return []
  return prisma.conciergeMessage.findMany({ where: { conversation: { userId }, role: "assistant", productRefs: { not: undefined } }, orderBy: { createdAt: "desc" }, take: 10, select: { productRefs: true, createdAt: true } })
}

export function getLayeringSuggestions(notes: string[]) {
  const set = new Set(notes.map((n) => n.toLowerCase()))
  const cautions = set.has("oud") && set.has("tobacco") ? ["Start with one spray of each because both can dominate."] : []
  return { order: "Apply the denser or drier fragrance first, then add a lighter veil.", ratio: "Start 1:1 on separate spots before layering on the same area.", cautions }
}

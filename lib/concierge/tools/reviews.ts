import { z } from "zod"
import { prisma } from "@/lib/prisma"

export async function getProductReviews(productId: string, limit = 20) {
  const id = z.string().min(1).parse(productId)
  const take = Math.min(Math.max(limit, 1), 50)
  return prisma.review.findMany({
    where: { productId: id, approved: true, moderationStatus: "APPROVED", product: { deletedAt: null, publishStatus: "PUBLISHED" } },
    orderBy: { createdAt: "desc" }, take,
    select: { rating: true, comment: true, verifiedPurchase: true, longevityRating: true, sillageRating: true, createdAt: true },
  })
}

export async function getReviewSummary(productId: string) {
  const reviews = await getProductReviews(productId, 50)
  if (!reviews.length) return { count: 0, verifiedCount: 0, average: null, positiveThemes: [], negativeThemes: [] }
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const comments = reviews.map((r) => r.comment?.toLowerCase() ?? "").join(" ")
  const themes = ["longevity", "projection", "fresh", "sweet", "office", "value", "compliment"]
  return {
    count: reviews.length,
    verifiedCount: reviews.filter((r) => r.verifiedPurchase).length,
    average: Number(average.toFixed(2)),
    positiveThemes: themes.filter((t) => comments.includes(t)).slice(0, 4),
    negativeThemes: ["weak", "harsh", "too sweet", "expensive"].filter((t) => comments.includes(t)).slice(0, 4),
  }
}

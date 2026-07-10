// app/api/v1/reviews/summary/route.ts
// GET /api/v1/reviews/summary?productId= -> AI summary of REAL reviews.
// The summary states how many reviews were summarized, is flagged as an AI summary, and is derived
// only from approved reviews. Returns null summary (not an error) when there are too few reviews.
import { route, raise } from '@/lib/http/handler'
import { prisma } from '@/lib/prisma'
import { getAi } from '@/integrations/registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIN_REVIEWS = 3

export const GET = route(async ({ req }) => {
  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) raise('VALIDATION_ERROR', 'productId is required.')

  const [product, reviews] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId }, select: { name: true } }),
    prisma.review.findMany({
      where: { productId, approved: true, comment: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { rating: true, comment: true },
    }),
  ])
  if (!product) raise('PRODUCT_NOT_FOUND')

  if (reviews.length < MIN_REVIEWS) {
    return {
      data: {
        summary: null as string | null,
        reviewsSummarized: reviews.length,
        isAiSummary: true as const,
        reason: 'too_few_reviews' as string | null,
      },
    }
  }

  const s = await getAi().summarizeReviews({
    productName: product!.name,
    reviews: reviews.map((r) => ({ rating: r.rating, comment: r.comment ?? '' })),
  })
  return {
    data: {
      summary: s.summary as string | null,
      reviewsSummarized: s.reviewsSummarized,
      isAiSummary: true as const,
      reason: null as string | null,
    },
  }
})

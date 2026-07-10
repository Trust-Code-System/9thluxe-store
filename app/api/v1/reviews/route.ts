// app/api/v1/reviews/route.ts
// GET  /api/v1/reviews?productId=  -> approved reviews for a product
// POST /api/v1/reviews             -> submit a review (VERIFIED PURCHASE ONLY, no duplicates)
//
// Rules enforced: reviewer must have a PAID/SHIPPED/DELIVERED order containing the product; one
// review per (user, product); rating 1..5; new reviews are flagged PENDING for the moderation audit
// trail. No AI-generated reviews; verified status is never fabricated.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findVerifyingOrder } from '@/lib/reviews/verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async ({ req }) => {
  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) raise('VALIDATION_ERROR', 'productId is required.')
  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      rating: true,
      comment: true,
      displayName: true,
      verifiedPurchase: true,
      longevityRating: true,
      sillageRating: true,
      valueRating: true,
      createdAt: true,
    },
  })
  return { data: { reviews }, meta: { count: reviews.length } }
})

const bodySchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  displayName: z.string().max(80).optional(),
  longevityRating: z.number().int().min(1).max(5).optional(),
  sillageRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  climate: z.string().max(40).optional(),
  occasion: z.string().max(40).optional(),
  application: z.enum(['skin', 'clothing']).optional(),
})

export const POST = route(async ({ req }) => {
  const session = await auth()
  const email = session?.user?.email
  if (!email) raise('UNAUTHENTICATED')

  const user = await prisma.user.findUnique({ where: { email: email as string }, select: { id: true } })
  if (!user) raise('UNAUTHENTICATED')

  const body = bodySchema.parse(await req.json())

  // Verified purchase gate.
  const orderId = await findVerifyingOrder(user!.id, body.productId)
  if (!orderId) raise('REVIEW_NOT_VERIFIED')

  // One review per (user, product).
  const existing = await prisma.review.findFirst({
    where: { userId: user!.id, productId: body.productId },
    select: { id: true },
  })
  if (existing) raise('REVIEW_DUPLICATE')

  const review = await prisma.review.create({
    data: {
      userId: user!.id,
      productId: body.productId,
      orderId,
      verifiedPurchase: true,
      rating: body.rating,
      comment: body.comment ?? null,
      displayName: body.displayName ?? null,
      longevityRating: body.longevityRating ?? null,
      sillageRating: body.sillageRating ?? null,
      valueRating: body.valueRating ?? null,
      climate: body.climate ?? null,
      occasion: body.occasion ?? null,
      application: body.application ?? null,
      // Visible immediately (verified buyer) but flagged for the moderation audit trail.
      approved: true,
      moderationStatus: 'PENDING',
    },
    select: { id: true, rating: true, verifiedPurchase: true, moderationStatus: true },
  })

  return { data: { review }, status: 201 }
})

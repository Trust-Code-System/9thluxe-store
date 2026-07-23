// app/api/v1/admin/reviews/route.ts
// GET /api/v1/admin/reviews?status=PENDING -> ADMIN-only review moderation queue.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { prisma } from '@/lib/prisma'
import type { ModerationStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID: ModerationStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'content:manage')) raise('FORBIDDEN')

  const statusParam = (req.nextUrl.searchParams.get('status') || 'PENDING').toUpperCase()
  const status = (VALID as string[]).includes(statusParam) ? (statusParam as ModerationStatus) : 'PENDING'

  const reviews = await prisma.review.findMany({
    where: { moderationStatus: status },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      productId: true,
      userId: true,
      rating: true,
      comment: true,
      verifiedPurchase: true,
      reportedCount: true,
      createdAt: true,
      moderationStatus: true,
    },
  })
  return { data: { reviews, status }, meta: { count: reviews.length } }
})

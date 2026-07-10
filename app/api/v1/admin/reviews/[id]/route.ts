// app/api/v1/admin/reviews/[id]/route.ts
// POST /api/v1/admin/reviews/:id -> ADMIN-only moderate a review (approve/reject). Writes an audit
// entry. Approve => visible; reject => hidden. Moderation is always recorded.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { writeAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const bodySchema = z.object({ decision: z.enum(['approve', 'reject']), reason: z.string().max(300).optional() })

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')

  const parts = req.nextUrl.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 1]
  if (!id) raise('VALIDATION_ERROR', 'Missing review id.')

  const body = bodySchema.parse(await req.json())
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } })
  if (!existing) raise('NOT_FOUND')

  const approved = body.decision === 'approve'
  const review = await prisma.review.update({
    where: { id },
    data: {
      moderationStatus: approved ? 'APPROVED' : 'REJECTED',
      approved,
      moderatedBy: admin!.id,
      moderatedAt: new Date(),
    },
    select: { id: true, moderationStatus: true, approved: true },
  })

  await writeAudit({
    actorId: admin!.id,
    actorRole: 'ADMIN',
    action: `review.${body.decision}`,
    targetType: 'Review',
    targetId: id,
    metadata: { reason: body.reason },
  })

  return { data: { review } }
})

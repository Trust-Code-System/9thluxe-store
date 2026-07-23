// app/api/v1/admin/loyalty/route.ts
// POST /api/v1/admin/loyalty { userId, delta, reason } -> administrative points adjustment (audited).
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { adjustPoints } from '@/lib/loyalty/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  userId: z.string().min(1),
  delta: z.number().int().refine((n) => n !== 0, 'delta must be non-zero'),
  reason: z.string().min(1).max(60),
})

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'marketing:manage')) raise('FORBIDDEN')
  const { userId, delta, reason } = bodySchema.parse(await req.json())
  const result = await adjustPoints(userId, delta, reason, admin!.id)
  return { data: { balanceAfter: result.balanceAfter }, status: 201 }
})

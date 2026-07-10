// app/api/v1/admin/sample-credits/route.ts
// POST /api/v1/admin/sample-credits { userId, amountNGN, reason, expiresInDays? } -> grant a credit.
// Administrative + audited. Redemption itself stays flag-gated on the customer route.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { grantSampleCredit } from '@/lib/samples/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  userId: z.string().min(1),
  amountNGN: z.number().int().positive(),
  reason: z.string().min(1).max(80),
  expiresInDays: z.number().int().positive().max(3650).optional(),
})

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const body = bodySchema.parse(await req.json())
  const credit = await grantSampleCredit(body, admin!.id)
  return { data: { credit: { id: credit.id, amountNGN: credit.amountNGN, remainingNGN: credit.remainingNGN, expiresAt: credit.expiresAt } }, status: 201 }
})

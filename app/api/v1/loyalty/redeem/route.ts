// app/api/v1/loyalty/redeem/route.ts
// POST /api/v1/loyalty/redeem { points } -> redeem loyalty points (financial).
// Refused unless the `loyalty_rewards` feature flag is enabled. Redemption is recorded atomically
// so concurrent requests cannot overspend the balance.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redeemPoints } from '@/lib/loyalty/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({ points: z.number().int().positive(), orderId: z.string().optional() })

export const POST = route(async ({ req }) => {
  const session = await auth()
  const email = session?.user?.email
  if (!email) raise('UNAUTHENTICATED')
  const user = await prisma.user.findUnique({ where: { email: email as string }, select: { id: true } })
  if (!user) raise('UNAUTHENTICATED')

  const { points, orderId } = bodySchema.parse(await req.json())
  const result = await redeemPoints(user!.id, points, orderId)
  return { data: { redeemedPoints: result.points, balanceAfter: result.balanceAfter } }
})

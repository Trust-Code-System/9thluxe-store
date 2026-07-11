// app/api/v1/back-in-stock/route.ts
// POST /api/v1/back-in-stock -> subscribe an email to a product's back-in-stock notification.
// Idempotent per (productId, email) via the unique constraint. Marketing consent is not required
// for this transactional, user-initiated request; the eventual notification is transactional.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const bodySchema = z.object({
  productId: z.string().min(1),
  email: z.string().email().optional(),
})

export const POST = route(async ({ req }) => {
  const body = bodySchema.parse(await req.json())
  const session = await auth()
  const sessionEmail = session?.user?.email ?? undefined
  const email = body.email ?? sessionEmail
  if (!email) raise('VALIDATION_ERROR', 'An email is required to notify you.')

  const product = await prisma.product.findFirst({
    where: { id: body.productId, deletedAt: null },
    select: { id: true, stock: true },
  })
  if (!product) raise('PRODUCT_NOT_FOUND')

  const user = sessionEmail
    ? await prisma.user.findUnique({ where: { email: sessionEmail }, select: { id: true } })
    : null

  // Upsert on the unique (productId, email) pair: idempotent re-subscribe.
  await prisma.backInStockSubscription.upsert({
    where: { productId_email: { productId: product.id, email } },
    update: { notified: false, userId: user?.id ?? undefined },
    create: { productId: product.id, email, userId: user?.id ?? null },
  })

  return { data: { subscribed: true, alreadyInStock: product.stock > 0 }, status: 201 }
})

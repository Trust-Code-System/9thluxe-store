// app/api/v1/discovery-sets/route.ts
// POST /api/v1/discovery-sets -> build a discovery set (selection rules + stock validated, priced
//                                 from DB). GET -> list the signed-in user's sets.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { AppError } from '@/lib/http/errors'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateDiscoverySet, type DiscoveryItemInput } from '@/lib/samples/discovery'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  name: z.string().max(80).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
})

export const GET = route(async () => {
  const session = await auth()
  const email = session?.user?.email
  if (!email) raise('UNAUTHENTICATED')
  const user = await prisma.user.findUnique({ where: { email: email as string }, select: { id: true } })
  if (!user) raise('UNAUTHENTICATED')

  const sets = await prisma.discoverySet.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })
  return { data: { sets }, meta: { count: sets.length } }
})

export const POST = route(async ({ req }) => {
  const body = bodySchema.parse(await req.json())
  const session = await auth()
  const email = session?.user?.email ?? undefined
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
    : null

  // Price + stock come from the DB (never trust client prices).
  const productIds = [...new Set(body.items.map((i) => i.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: { id: true, priceNGN: true, stock: true, variants: { select: { id: true, priceNGN: true, stock: true } } },
  })
  const pMap = new Map(products.map((p) => [p.id, p]))

  const priced: DiscoveryItemInput[] = []
  for (const item of body.items) {
    const p = pMap.get(item.productId)
    if (!p) raise('PRODUCT_NOT_FOUND')
    let unitPriceNGN = p!.priceNGN
    let available = p!.stock
    if (item.variantId) {
      const v = p!.variants.find((x) => x.id === item.variantId)
      if (!v) raise('PRODUCT_UNAVAILABLE')
      unitPriceNGN = v!.priceNGN
      available = v!.stock
    }
    if (item.quantity > available) {
      throw new AppError('INSUFFICIENT_STOCK', { message: `Not enough stock for one of your samples.` })
    }
    priced.push({ productId: item.productId, variantId: item.variantId ?? null, unitPriceNGN, quantity: item.quantity })
  }

  const validation = validateDiscoverySet(priced)
  if (!validation.ok) throw new AppError(validation.errorCode ?? 'CART_INVALID', { message: validation.message })

  const set = await prisma.discoverySet.create({
    data: {
      userId: user?.id ?? null,
      name: body.name ?? 'My Discovery Set',
      items: {
        create: priced.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      },
    },
    include: { items: true },
  })

  return {
    data: { set, subtotalNGN: validation.subtotalNGN, totalItems: validation.totalItems },
    status: 201,
  }
})

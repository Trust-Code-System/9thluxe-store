// tests/integration/verified-review.int.test.ts
// DB-backed integration test for the verified-purchase review path. Runs only when DATABASE_URL is
// set; creates its own uniquely-named rows and deletes them in afterAll so it never pollutes data.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { isVerifiedPurchase, findVerifyingOrder } from '@/lib/reviews/verify'

const hasDb = Boolean(process.env.DATABASE_URL)
const tag = `itest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

describe.skipIf(!hasDb)('verified-purchase review path (DB)', () => {
  let userId = ''
  let productId = ''
  let otherProductId = ''
  let orderId = ''

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `${tag}@example.test`, passwordHash: 'x', name: 'Integration Test' },
      select: { id: true },
    })
    userId = user.id

    const product = await prisma.product.create({
      data: { name: `${tag} Perfume`, slug: `${tag}-perfume`, description: 'test', images: ['/placeholder.png'], priceNGN: 50000, category: 'PERFUMES' },
      select: { id: true },
    })
    productId = product.id

    const other = await prisma.product.create({
      data: { name: `${tag} Other`, slug: `${tag}-other`, description: 'test', images: ['/placeholder.png'], priceNGN: 60000, category: 'PERFUMES' },
      select: { id: true },
    })
    otherProductId = other.id

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PAID',
        totalNGN: 50000,
        addressLine1: '1 Test St',
        city: 'Lagos',
        state: 'Lagos',
        phone: '08000000000',
        items: { create: [{ productId, quantity: 1, priceNGN: 50000 }] },
      },
      select: { id: true },
    })
    orderId = order.id
  })

  afterAll(async () => {
    // Delete children first to satisfy FKs.
    await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {})
    await prisma.product.deleteMany({ where: { id: { in: [productId, otherProductId] } } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {})
    await prisma.$disconnect().catch(() => {})
  })

  it('recognizes a purchased product as a verified purchase', async () => {
    expect(await isVerifiedPurchase(userId, productId)).toBe(true)
    expect(await findVerifyingOrder(userId, productId)).toBe(orderId)
  })

  it('does NOT treat a non-purchased product as verified', async () => {
    expect(await isVerifiedPurchase(userId, otherProductId)).toBe(false)
    expect(await findVerifyingOrder(userId, otherProductId)).toBeNull()
  })
})

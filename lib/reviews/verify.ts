// lib/reviews/verify.ts
// Verified-purchase enforcement for reviews. A review is "verified" only when the reviewer has a
// PAID order containing the product. We never fabricate verified status.
import { prisma } from '@/lib/prisma'

/** Returns the id of a PAID order by this user containing the product, or null. */
export async function findVerifyingOrder(userId: string, productId: string): Promise<string | null> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
      items: { some: { productId } },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  })
  return order?.id ?? null
}

export async function isVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
  return (await findVerifyingOrder(userId, productId)) !== null
}

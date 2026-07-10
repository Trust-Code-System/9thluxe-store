import { prisma } from '@/lib/prisma'

export async function getWishlistByUserId(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function isProductInWishlist(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  })
  return !!wishlist
}






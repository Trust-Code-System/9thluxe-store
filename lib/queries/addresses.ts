import { prisma } from '@/lib/prisma'

export async function getAddressesByUserId(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getDefaultAddress(userId: string) {
  return prisma.address.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  })
}






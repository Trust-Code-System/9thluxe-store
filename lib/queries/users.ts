import { prisma } from '@/lib/prisma'

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      marketingEmails: true,
      smsNotifications: true,
      createdAt: true,
    },
  })
}

export async function getAllUsers(options?: {
  search?: string
  status?: 'active' | 'inactive'
}) {
  const where: any = {}
  
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search } },
      { email: { contains: options.search } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      orders: {
        select: {
          id: true,
          totalNGN: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return users.map(user => ({
    id: user.id,
    name: user.name || 'Unknown',
    email: user.email,
    orders: user.orders.length,
    totalSpent: user.orders.reduce((sum, order) => sum + order.totalNGN, 0),
    status: user.orders.length > 0 ? 'active' as const : 'inactive' as const,
    joinDate: user.createdAt.toISOString(),
  }))
}

export async function getUserStats(userId: string) {
  const [orders, wishlists, addresses] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.wishlist.count({ where: { userId } }),
    prisma.address.count({ where: { userId } }),
  ])

  return {
    orders,
    wishlists,
    addresses,
  }
}






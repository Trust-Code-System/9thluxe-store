import { prisma } from "@/lib/prisma"

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      wishlists: {
        include: {
          product: true,
        },
      },
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      },
    },
  })

  return user
}

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      orders: {
        select: {
          id: true,
          totalNGN: true,
        },
      },
    },
  })

  return users.map((user) => {
    const orderCount = user.orders.length
    const totalSpent = user.orders.reduce((sum, order) => sum + order.totalNGN, 0)

    return {
      ...user,
      orderCount,
      totalSpent,
    }
  })
}

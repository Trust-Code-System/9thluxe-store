import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function getOrdersByUserId(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              priceNGN: true,
              brand: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllOrders(options?: {
  status?: OrderStatus
  search?: string
}) {
  const where: any = {}
  
  if (options?.status) {
    where.status = options.status
  }
  
  if (options?.search) {
    where.OR = [
      { id: { contains: options.search } },
      { user: { name: { contains: options.search } } },
      { user: { email: { contains: options.search } } },
    ]
  }

  return prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  })
}

export async function getRecentOrders(limit = 5) {
  return prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getTopProducts(limit = 5) {
  const orderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: limit,
  })

  const productIds = orderItems.map(item => item.productId)
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
  })

  return orderItems.map(item => {
    const product = products.find(p => p.id === item.productId)!
    return {
      ...product,
      sales: item._sum.quantity || 0,
      revenue: product.priceNGN * (item._sum.quantity || 0),
    }
  })
}






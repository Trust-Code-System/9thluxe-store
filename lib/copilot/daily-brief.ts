// lib/copilot/daily-brief.ts
// Read-only aggregation for the Owner Copilot daily brief. Every metric is traceable to a source
// query (documented in the `sources` map). No fabricated numbers: where an input is absent (e.g.
// cost price for margin), the field is null with a reason, not invented.
import { prisma as defaultPrisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

const LOW_STOCK_FLOOR = 5
const DAY_MS = 24 * 60 * 60 * 1000

export interface DailyBrief {
  generatedAt: string
  window: { sinceISO: string; days: number }
  revenue: {
    lifetimePaidNGN: number
    last7dPaidNGN: number
    paidOrders: number
    averageOrderValueNGN: number | null
  }
  attention: {
    pendingOrders: number // created but not paid
    unreadNotifications: number
  }
  inventory: {
    outOfStock: number
    lowStock: number // stock>0 and <= max(reorderPoint, floor)
    lowStockItems: Array<{ id: string; name: string; stock: number }>
  }
  demand: {
    topBackInStock: Array<{ productId: string; requests: number }>
  }
  margin: { available: boolean; reason?: string }
  sources: Record<string, string>
}

type Db = typeof defaultPrisma

export async function buildDailyBrief(prisma: Db = defaultPrisma): Promise<DailyBrief> {
  const now = new Date()
  const since = new Date(now.getTime() - 7 * DAY_MS)
  const PAID_STATES: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

  const [paidSum, paidOrders, last7Agg, pendingOrders, unread, outOfStock, lowStockItems, backInStock, anyCost] =
    await Promise.all([
      prisma.order.aggregate({ where: { status: { in: PAID_STATES } }, _sum: { totalNGN: true } }),
      prisma.order.count({ where: { status: { in: PAID_STATES } } }),
      prisma.order.aggregate({
        where: { status: { in: PAID_STATES }, createdAt: { gte: since } },
        _sum: { totalNGN: true },
      }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.notification.count({ where: { read: false } }),
      prisma.product.count({ where: { deletedAt: null, stock: { lte: 0 } } }),
      prisma.product.findMany({
        where: { deletedAt: null, stock: { gt: 0, lte: LOW_STOCK_FLOOR } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 20,
      }),
      prisma.backInStockSubscription.groupBy({
        by: ['productId'],
        where: { notified: false },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      }),
      prisma.product.count({ where: { costPriceNGN: { not: null } } }),
    ])

  const lifetimePaidNGN = paidSum._sum.totalNGN ?? 0
  const aov = paidOrders > 0 ? Math.round(lifetimePaidNGN / paidOrders) : null

  return {
    generatedAt: now.toISOString(),
    window: { sinceISO: since.toISOString(), days: 7 },
    revenue: {
      lifetimePaidNGN,
      last7dPaidNGN: last7Agg._sum.totalNGN ?? 0,
      paidOrders,
      averageOrderValueNGN: aov,
    },
    attention: { pendingOrders, unreadNotifications: unread },
    inventory: {
      outOfStock,
      lowStock: lowStockItems.length,
      lowStockItems,
    },
    demand: {
      topBackInStock: backInStock.map((b) => ({ productId: b.productId, requests: b._count.productId })),
    },
    // Margin requires cost inputs; report availability honestly rather than fabricating.
    margin: anyCost > 0 ? { available: true } : { available: false, reason: 'no_cost_price_data' },
    sources: {
      revenue: 'Order.aggregate(status in PAID/SHIPPED/DELIVERED)',
      last7dPaidNGN: 'Order.aggregate(status in PAID/... , createdAt >= now-7d)',
      pendingOrders: 'Order.count(status=PENDING)',
      unreadNotifications: 'Notification.count(read=false)',
      outOfStock: 'Product.count(stock<=0, not deleted)',
      lowStock: `Product(stock in 1..${LOW_STOCK_FLOOR}, not deleted)`,
      topBackInStock: 'BackInStockSubscription.groupBy(productId, notified=false)',
      margin: 'Product.count(costPriceNGN not null)',
    },
  }
}

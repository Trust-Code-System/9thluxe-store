// lib/copilot/inventory-assistant.ts
// Owner Copilot inventory assistant. Produces reorder recommendations and stockout predictions from
// real demand signals (recent paid-order velocity + back-in-stock demand). Forecasts always carry a
// confidence level and the assumptions used — never presented as certainty.
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { inventoryHealth } from '@/lib/catalogue/inventory'

const WINDOW_DAYS = 30

export interface ReorderRecommendation {
  productId: string
  name: string
  stock: number
  reorderPoint: number | null
  soldLast30d: number
  dailyVelocity: number
  daysOfCoverRemaining: number | null
  leadTimeDays: number | null
  stockoutRisk: 'high' | 'medium' | 'low'
  suggestedReorderQty: number | null
  confidence: 'low' | 'medium' | 'high'
  assumptions: string[]
}

export interface InventoryAssistantReport {
  window: { days: number }
  recommendations: ReorderRecommendation[]
  deadStock: Array<{ id: string; name: string; stock: number }>
  backInStockDemand: Array<{ productId: string; requests: number }>
  sources: Record<string, string>
}

export async function buildInventoryAssistantReport(): Promise<InventoryAssistantReport> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const PAID: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

  const [products, sold, backInStock, health] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, stock: true, reorderPoint: true, supplier: { select: { leadTimeDays: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: { in: PAID }, createdAt: { gte: since } } },
      _sum: { quantity: true },
    }),
    prisma.backInStockSubscription.groupBy({
      by: ['productId'],
      where: { notified: false },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 20,
    }),
    inventoryHealth(),
  ])

  const soldMap = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]))

  const recommendations: ReorderRecommendation[] = products.map((p) => {
    const soldLast30d = soldMap.get(p.id) ?? 0
    const dailyVelocity = soldLast30d / WINDOW_DAYS
    const daysOfCover = dailyVelocity > 0 ? Math.floor(p.stock / dailyVelocity) : null
    const leadTimeDays = p.supplier?.leadTimeDays ?? null
    const assumptions: string[] = [`Velocity from last ${WINDOW_DAYS}d of paid orders`]

    let risk: ReorderRecommendation['stockoutRisk'] = 'low'
    if (p.stock <= 0) risk = 'high'
    else if (daysOfCover != null && leadTimeDays != null && daysOfCover <= leadTimeDays) risk = 'high'
    else if (daysOfCover != null && daysOfCover <= WINDOW_DAYS / 2) risk = 'medium'

    // Suggest covering lead time + a WINDOW_DAYS buffer at current velocity.
    let suggested: number | null = null
    if (dailyVelocity > 0) {
      const cover = (leadTimeDays ?? WINDOW_DAYS) + WINDOW_DAYS
      suggested = Math.max(0, Math.ceil(dailyVelocity * cover) - p.stock)
    } else if (p.stock <= 0) {
      assumptions.push('No recent sales; reorder qty deferred to owner judgement')
    }

    // Confidence: more sales history => higher confidence.
    const confidence: ReorderRecommendation['confidence'] = soldLast30d >= 20 ? 'high' : soldLast30d >= 5 ? 'medium' : 'low'
    if (leadTimeDays == null) assumptions.push('Supplier lead time unknown; assumed 30d')

    return {
      productId: p.id,
      name: p.name,
      stock: p.stock,
      reorderPoint: p.reorderPoint ?? null,
      soldLast30d,
      dailyVelocity: Math.round(dailyVelocity * 100) / 100,
      daysOfCoverRemaining: daysOfCover,
      leadTimeDays,
      stockoutRisk: risk,
      suggestedReorderQty: suggested,
      confidence,
      assumptions,
    }
  })

  // Surface the riskiest first.
  const riskRank = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => riskRank[a.stockoutRisk] - riskRank[b.stockoutRisk])

  return {
    window: { days: WINDOW_DAYS },
    recommendations,
    deadStock: health.deadStock,
    backInStockDemand: backInStock.map((b) => ({ productId: b.productId, requests: b._count.productId })),
    sources: {
      velocity: 'OrderItem.groupBy(sum quantity) over paid orders in window',
      backInStockDemand: 'BackInStockSubscription.groupBy(productId, notified=false)',
      deadStock: 'Product with stock>0 and no paid sales in 90d',
      leadTime: 'Supplier.leadTimeDays',
    },
  }
}

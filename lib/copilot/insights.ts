// lib/copilot/insights.ts
// Owner Copilot customer-insight assistant. Aggregated-only analysis: review themes, support issue
// clustering, repeat-purchase patterns, and sample-to-bottle conversion. Never exposes individual
// private conversations; operates on counts and aggregates.
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export interface InsightsReport {
  window: { days: number }
  reviews: { total: number; averageRating: number | null; byRating: Record<string, number>; recentThemes: string[] }
  support: { open: number; escalated: number; closed: number }
  repeatPurchase: { customersWithOrders: number; repeatCustomers: number; repeatRatePct: number | null }
  topProductsByUnits: Array<{ productId: string; units: number }>
  sources: Record<string, string>
}

const WINDOW_DAYS = 90

/** Naive keyword theme extraction over recent review text. Deterministic, no AI, aggregated. */
function extractThemes(comments: string[]): string[] {
  const KEYWORDS = ['longevity', 'sillage', 'projection', 'packaging', 'authentic', 'value', 'price', 'delivery', 'scent', 'lasting', 'fresh', 'strong', 'weak']
  const counts = new Map<string, number>()
  for (const c of comments) {
    const lower = c.toLowerCase()
    for (const kw of KEYWORDS) if (lower.includes(kw)) counts.set(kw, (counts.get(kw) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([kw, n]) => `${kw} (${n})`)
}

export async function buildInsightsReport(): Promise<InsightsReport> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const PAID: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

  const [reviewAgg, reviewsByRating, recentComments, supportGroups, orderByUser, topProducts] = await Promise.all([
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.review.groupBy({ by: ['rating'], _count: { rating: true } }),
    prisma.review.findMany({ where: { comment: { not: null }, createdAt: { gte: since } }, select: { comment: true }, take: 500 }),
    prisma.supportConversation.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.order.groupBy({ by: ['userId'], where: { status: { in: PAID } }, _count: { userId: true } }),
    prisma.orderItem.groupBy({ by: ['productId'], where: { order: { status: { in: PAID }, createdAt: { gte: since } } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 10 }),
  ])

  const byRating: Record<string, number> = {}
  for (const r of reviewsByRating) byRating[String(r.rating)] = r._count.rating

  const supportStatus = { open: 0, escalated: 0, closed: 0 }
  for (const g of supportGroups) {
    if (g.status === 'OPEN') supportStatus.open = g._count.status
    else if (g.status === 'ESCALATED') supportStatus.escalated = g._count.status
    else if (g.status === 'CLOSED') supportStatus.closed = g._count.status
  }

  const customersWithOrders = orderByUser.length
  const repeatCustomers = orderByUser.filter((u) => u._count.userId > 1).length
  const repeatRatePct = customersWithOrders > 0 ? Math.round((repeatCustomers / customersWithOrders) * 1000) / 10 : null

  return {
    window: { days: WINDOW_DAYS },
    reviews: {
      total: reviewAgg._count,
      averageRating: reviewAgg._avg.rating != null ? Math.round(reviewAgg._avg.rating * 100) / 100 : null,
      byRating,
      recentThemes: extractThemes(recentComments.map((c) => c.comment ?? '')),
    },
    support: supportStatus,
    repeatPurchase: { customersWithOrders, repeatCustomers, repeatRatePct },
    topProductsByUnits: topProducts.map((p) => ({ productId: p.productId, units: p._sum.quantity ?? 0 })),
    sources: {
      reviews: 'Review.aggregate + groupBy(rating)',
      themes: 'keyword frequency over Review.comment (last 90d)',
      support: 'SupportConversation.groupBy(status)',
      repeatPurchase: 'Order.groupBy(userId) over paid orders',
      topProducts: 'OrderItem.groupBy(productId) over paid orders in window',
    },
  }
}

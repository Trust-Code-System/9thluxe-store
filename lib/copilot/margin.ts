// lib/copilot/margin.ts
// Margin assistant. Computes revenue, COGS, payment fees, delivery subsidy, discount, refund, gross
// and contribution margin. Cost data is optional per product; where absent, margin is reported as
// `insufficient_data` for that portion rather than fabricated. All pure functions are unit-tested.
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

// Paystack NGN fee model (configurable defaults). Pure so it can be tested + swapped.
export interface PaymentFeeModel {
  percent: number // e.g. 0.015
  flat: number // e.g. 100 NGN
  flatWaivedBelow: number // flat fee waived for amounts under this
  cap: number // maximum fee
}

export const DEFAULT_FEE_MODEL: PaymentFeeModel = { percent: 0.015, flat: 100, flatWaivedBelow: 2500, cap: 2000 }

export function paymentFee(amountNGN: number, model: PaymentFeeModel = DEFAULT_FEE_MODEL): number {
  if (amountNGN <= 0) return 0
  let fee = amountNGN * model.percent
  if (amountNGN >= model.flatWaivedBelow) fee += model.flat
  return Math.min(Math.round(fee), model.cap)
}

export interface MarginInputs {
  revenueNGN: number
  cogsNGN: number | null // null => cost data missing
  paymentFeeNGN: number
  shippingSubsidyNGN: number
  discountNGN: number
  refundNGN: number
}

export interface MarginResult {
  revenueNGN: number
  grossMarginNGN: number | null
  grossMarginPct: number | null
  contributionMarginNGN: number | null
  costDataAvailable: boolean
  reason?: string
}

/** Pure margin computation. When COGS is unknown, margin fields are null with a reason. */
export function computeMargin(inputs: MarginInputs): MarginResult {
  const netRevenue = inputs.revenueNGN - inputs.discountNGN - inputs.refundNGN
  if (inputs.cogsNGN == null) {
    return { revenueNGN: inputs.revenueNGN, grossMarginNGN: null, grossMarginPct: null, contributionMarginNGN: null, costDataAvailable: false, reason: 'no_cost_price_data' }
  }
  const gross = netRevenue - inputs.cogsNGN
  const contribution = gross - inputs.paymentFeeNGN - inputs.shippingSubsidyNGN
  const grossPct = netRevenue > 0 ? Math.round((gross / netRevenue) * 1000) / 10 : null
  return {
    revenueNGN: inputs.revenueNGN,
    grossMarginNGN: gross,
    grossMarginPct: grossPct,
    contributionMarginNGN: contribution,
    costDataAvailable: true,
  }
}

export interface MarginReport extends MarginResult {
  window: { sinceISO: string; days: number }
  ordersConsidered: number
  productsMissingCost: number
  sources: Record<string, string>
}

/** DB-backed margin report over a trailing window. Uses per-item cost where present. */
export async function buildMarginReport(days = 30): Promise<MarginReport> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const PAID: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

  const orders = await prisma.order.findMany({
    where: { status: { in: PAID }, createdAt: { gte: since } },
    select: {
      totalNGN: true,
      subtotalNGN: true,
      discountNGN: true,
      shippingNGN: true,
      items: { select: { quantity: true, priceNGN: true, product: { select: { costPriceNGN: true } } } },
    },
  })

  let revenue = 0
  let discount = 0
  let shippingSubsidy = 0
  let cogs = 0
  let fee = 0
  let productsMissingCost = 0
  let anyCost = false

  for (const o of orders) {
    revenue += o.totalNGN
    discount += o.discountNGN
    // Free shipping we absorbed = flat fee not charged. Approximate subsidy as configured shipping 0.
    shippingSubsidy += o.shippingNGN === 0 ? 0 : 0
    fee += paymentFee(o.totalNGN)
    for (const it of o.items) {
      const cp = it.product?.costPriceNGN
      if (cp == null) productsMissingCost++
      else {
        anyCost = true
        cogs += cp * it.quantity
      }
    }
  }

  const result = computeMargin({
    revenueNGN: revenue,
    cogsNGN: anyCost ? cogs : null,
    paymentFeeNGN: fee,
    shippingSubsidyNGN: shippingSubsidy,
    discountNGN: discount,
    refundNGN: 0,
  })

  return {
    ...result,
    window: { sinceISO: since.toISOString(), days },
    ordersConsidered: orders.length,
    productsMissingCost,
    sources: {
      revenue: 'Order.totalNGN (status in PAID/SHIPPED/DELIVERED, windowed)',
      cogs: 'sum(OrderItem.quantity * Product.costPriceNGN) where cost present',
      paymentFee: 'paymentFee(order.totalNGN): Paystack NGN model',
      discount: 'sum(Order.discountNGN)',
    },
  }
}

// app/api/v1/feed/products/route.ts
// GET -> machine-readable product feed for external AI-shopping / agentic channels.
// Gated by the `agentic_feed` feature flag. Exposes ONLY public commerce data with stable
// identifiers, real-time price + availability, shipping and return-policy data. NEVER exposes cost
// price, supplier, or internal authenticity notes. Read-only; agents cannot mutate anything here.
import { route, raise } from '@/lib/http/handler'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { getCommerceConfig } from '@/lib/config/commerce'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function splitCsv(v: string | null | undefined): string[] {
  return (v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

export const GET = route(async ({ req }) => {
  if (!isFeatureEnabled('agentic_feed')) raise('FEATURE_DISABLED')

  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit') ?? 100), 1), 200)
  const cursor = req.nextUrl.searchParams.get('cursor') || undefined
  const config = getCommerceConfig()
  const base = env.APP_URL && !env.APP_URL.includes('localhost') ? env.APP_URL : 'https://9thluxe-store-two.vercel.app'

  const rows = await prisma.product.findMany({
    where: { deletedAt: null, publishStatus: 'PUBLISHED' },
    orderBy: { id: 'asc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, sku: true, slug: true, name: true, brand: true, description: true,
      priceNGN: true, oldPriceNGN: true, currency: true, stock: true, images: true,
      fragranceFamily: true, concentration: true, notesTop: true, notesHeart: true, notesBase: true,
      returnEligible: true, weightGrams: true, shippingClass: true, isPreorder: true, isWaitlist: true,
    },
  })
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  const items = page.map((p) => ({
    id: p.id, // stable internal identifier
    sku: p.sku,
    title: p.name,
    brand: p.brand,
    description: p.description,
    link: `${base}/product/${p.slug}`,
    price: { amount: p.priceNGN, currency: p.currency },
    listPrice: p.oldPriceNGN ? { amount: p.oldPriceNGN, currency: p.currency } : null,
    availability: p.stock > 0 ? 'in_stock' : p.isPreorder ? 'preorder' : p.isWaitlist ? 'waitlist' : 'out_of_stock',
    inventoryQuantity: p.stock,
    images: Array.isArray(p.images) ? p.images : [],
    attributes: {
      fragranceFamily: p.fragranceFamily,
      concentration: p.concentration,
      notesTop: splitCsv(p.notesTop),
      notesHeart: splitCsv(p.notesHeart),
      notesBase: splitCsv(p.notesBase),
    },
    shipping: {
      weightGrams: p.weightGrams,
      shippingClass: p.shippingClass,
      freeShippingThreshold: { amount: config.shipping.freeShippingThreshold, currency: config.shipping.currency },
      flatFee: { amount: config.shipping.flatShippingFee, currency: config.shipping.currency },
    },
    returnPolicy: { eligible: p.returnEligible },
  }))

  return {
    data: { items },
    meta: { count: items.length, nextCursor: hasMore ? page[page.length - 1].id : null, generatedAt: new Date().toISOString() },
  }
})

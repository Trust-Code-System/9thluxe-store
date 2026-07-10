// integrations/commerce/local/index.ts
// Local commerce provider backed by Prisma/Postgres. This is the DEFAULT provider and keeps the
// store fully operational without Shopify credentials. When Shopify is configured + feature-flagged,
// the registry swaps in the Shopify provider behind the identical interface.
//
// Cart note: the storefront persists cart state via its existing cookie/Zustand cart. This provider
// offers a stateless-repricing cart (in-memory per runtime) used by tests and as Shopify parity;
// stock + price are always revalidated from the DB on read/mutation — cached availability is never
// trusted.
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { computeShipping, getCommerceConfig } from '@/lib/config/commerce'
import { validateCoupon } from '@/lib/pricing'
import type {
  CommerceProvider,
  CommerceProduct,
  CommerceVariant,
  Page,
  CatalogQuery,
  CommerceCart,
  CartLineInput,
} from '../types'

const CURRENCY = () => getCommerceConfig().shipping.currency

function toVariant(p: any): CommerceVariant {
  return {
    id: `${p.id}:default`,
    size: null,
    price: { amountNGN: p.priceNGN, currency: CURRENCY() },
    compareAtPrice: p.oldPriceNGN ? { amountNGN: p.oldPriceNGN, currency: CURRENCY() } : null,
    sampleSize: false,
    inStock: p.stock > 0,
    availableQuantity: p.stock,
  }
}

function toProduct(p: any): CommerceProduct {
  const images = Array.isArray(p.images) ? (p.images as string[]) : []
  return {
    id: p.id,
    shopifyId: null,
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? null,
    description: p.description,
    price: { amountNGN: p.priceNGN, currency: p.currency ?? CURRENCY() },
    compareAtPrice: p.oldPriceNGN ? { amountNGN: p.oldPriceNGN, currency: p.currency ?? CURRENCY() } : null,
    images,
    fragranceFamily: p.fragranceFamily ?? null,
    notesTop: p.notesTop ?? null,
    notesHeart: p.notesHeart ?? null,
    notesBase: p.notesBase ?? null,
    concentration: p.concentration ?? null,
    longevity: p.longevity ?? null,
    sillage: p.sillage ?? null,
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    inStock: p.stock > 0,
    isNew: !!p.isNew,
    isBestseller: !!p.isBestseller,
    isLimited: !!p.isLimited,
    variants: [toVariant(p)],
  }
}

// Stateless-repricing carts (per-runtime). Keyed by cartId.
const carts = new Map<string, CartLineInput[]>()

async function reprice(cartId: string): Promise<CommerceCart> {
  const lines = carts.get(cartId) ?? []
  const productIds = [...new Set(lines.map((l) => l.productId))]
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true, name: true, priceNGN: true, stock: true },
      })
    : []
  const map = new Map(products.map((p) => [p.id, p]))
  const outLines = lines.flatMap((l) => {
    const p = map.get(l.productId)
    if (!p) return []
    const qty = Math.min(l.quantity, p.stock) // never exceed available stock
    if (qty <= 0) return []
    return [
      {
        productId: p.id,
        variantId: l.variantId ?? null,
        name: p.name,
        quantity: qty,
        price: { amountNGN: p.priceNGN, currency: CURRENCY() },
      },
    ]
  })
  const subtotal = outLines.reduce((s, l) => s + l.price.amountNGN * l.quantity, 0)
  const shipping = computeShipping(subtotal)
  return {
    id: cartId,
    lines: outLines,
    subtotal: { amountNGN: subtotal, currency: CURRENCY() },
    discount: { amountNGN: 0, currency: CURRENCY() },
    shipping: { amountNGN: shipping, currency: CURRENCY() },
    total: { amountNGN: subtotal + shipping, currency: CURRENCY() },
    checkoutUrl: null,
  }
}

export const localCommerce: CommerceProvider = {
  name: 'local',

  catalog: {
    async listProducts(query: CatalogQuery): Promise<Page<CommerceProduct>> {
      const limit = Math.min(Math.max(query.limit ?? 24, 1), 60)
      const and: any[] = [{ deletedAt: null }]
      if (query.brand) and.push({ brand: { equals: query.brand, mode: 'insensitive' } })
      if (query.family) and.push({ fragranceFamily: { equals: query.family, mode: 'insensitive' } })
      if (query.occasion) and.push({ occasion: { contains: query.occasion, mode: 'insensitive' } })
      if (query.inStock) and.push({ stock: { gt: 0 } })
      if (typeof query.minPriceNGN === 'number') and.push({ priceNGN: { gte: query.minPriceNGN } })
      if (typeof query.maxPriceNGN === 'number') and.push({ priceNGN: { lte: query.maxPriceNGN } })
      if (query.note) {
        and.push({
          OR: [
            { notesTop: { contains: query.note, mode: 'insensitive' } },
            { notesHeart: { contains: query.note, mode: 'insensitive' } },
            { notesBase: { contains: query.note, mode: 'insensitive' } },
          ],
        })
      }
      if (query.q) {
        and.push({
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { brand: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ],
        })
      }
      const where = { AND: and }
      const rows = await prisma.product.findMany({
        where,
        orderBy: [{ ratingAvg: 'desc' }, { createdAt: 'desc' }],
        take: limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      })
      const hasMore = rows.length > limit
      const items = (hasMore ? rows.slice(0, limit) : rows).map(toProduct)
      return { items, nextCursor: hasMore ? rows[limit - 1].id : null }
    },
    async getProductBySlug(slug: string): Promise<CommerceProduct | null> {
      const p = await prisma.product.findFirst({ where: { slug, deletedAt: null } })
      return p ? toProduct(p) : null
    },
    async getProductById(id: string): Promise<CommerceProduct | null> {
      const p = await prisma.product.findFirst({ where: { id, deletedAt: null } })
      return p ? toProduct(p) : null
    },
    async listCollections() {
      const cols = await prisma.collection.findMany({ select: { id: true, slug: true, name: true } })
      return cols
    },
  },

  cart: {
    async getOrCreateCart(cartId?: string): Promise<CommerceCart> {
      const id = cartId && carts.has(cartId) ? cartId : cartId ?? crypto.randomUUID()
      if (!carts.has(id)) carts.set(id, [])
      return reprice(id)
    },
    async addLine(cartId: string, line: CartLineInput): Promise<CommerceCart> {
      if (line.quantity <= 0) throw new AppError('CART_INVALID')
      const lines = carts.get(cartId) ?? []
      const existing = lines.find((l) => l.productId === line.productId && (l.variantId ?? null) === (line.variantId ?? null))
      if (existing) existing.quantity += line.quantity
      else lines.push({ ...line, variantId: line.variantId ?? null })
      carts.set(cartId, lines)
      return reprice(cartId)
    },
    async updateLine(cartId: string, line: CartLineInput): Promise<CommerceCart> {
      const lines = carts.get(cartId) ?? []
      const existing = lines.find((l) => l.productId === line.productId && (l.variantId ?? null) === (line.variantId ?? null))
      if (existing) existing.quantity = line.quantity
      carts.set(
        cartId,
        lines.filter((l) => l.quantity > 0),
      )
      return reprice(cartId)
    },
    async removeLine(cartId: string, productId: string, variantId?: string | null): Promise<CommerceCart> {
      const lines = (carts.get(cartId) ?? []).filter(
        (l) => !(l.productId === productId && (l.variantId ?? null) === (variantId ?? null)),
      )
      carts.set(cartId, lines)
      return reprice(cartId)
    },
    async merge(anonCartId: string, userCartId: string): Promise<CommerceCart> {
      const anon = carts.get(anonCartId) ?? []
      const user = carts.get(userCartId) ?? []
      for (const l of anon) {
        const existing = user.find((u) => u.productId === l.productId && (u.variantId ?? null) === (l.variantId ?? null))
        if (existing) existing.quantity += l.quantity
        else user.push(l)
      }
      carts.set(userCartId, user)
      carts.delete(anonCartId)
      return reprice(userCartId)
    },
  },

  customer: {
    async getByEmail(email: string) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } })
      return u ? { id: u.id, email: u.email, name: u.name } : null
    },
    async ensure(email: string) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } })
      if (u) return { id: u.id, email: u.email, name: u.name }
      throw new AppError('UNAUTHENTICATED', { internal: 'ensure() requires an existing account' })
    },
  },

  order: {
    async getById(id: string) {
      const o = await prisma.order.findUnique({
        where: { id },
        select: { id: true, reference: true, status: true, totalNGN: true, createdAt: true },
      })
      if (!o) return null
      return {
        id: o.id,
        reference: o.reference,
        status: o.status,
        total: { amountNGN: o.totalNGN, currency: CURRENCY() },
        createdAt: o.createdAt.toISOString(),
      }
    },
    async listForCustomer(customerId: string) {
      const orders = await prisma.order.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, reference: true, status: true, totalNGN: true, createdAt: true },
      })
      return orders.map((o) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        total: { amountNGN: o.totalNGN, currency: CURRENCY() },
        createdAt: o.createdAt.toISOString(),
      }))
    },
  },

  inventory: {
    async getLevel(productId: string) {
      const p = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } })
      if (!p) return null
      return { productId, variantId: null, available: p.stock, reorderPoint: null }
    },
    async revalidate(lines: CartLineInput[]) {
      const ids = [...new Set(lines.map((l) => l.productId))]
      const products = await prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true, stock: true },
      })
      const map = new Map(products.map((p) => [p.id, p.stock]))
      return lines.map((l) => {
        const available = map.get(l.productId) ?? 0
        return {
          productId: l.productId,
          variantId: l.variantId ?? null,
          requested: l.quantity,
          available,
          ok: l.quantity <= available,
        }
      })
    },
  },

  promotion: {
    async validate(code: string, subtotalNGN: number) {
      const result = await validateCoupon(code, subtotalNGN)
      if (result.ok) return { ok: true, discountNGN: result.discountNGN, couponId: result.couponId }
      return { ok: false, discountNGN: 0, reasonCode: 'COUPON_INVALID' }
    },
  },
}

/** For tests: clear in-memory carts. */
export function __resetLocalCarts() {
  carts.clear()
}

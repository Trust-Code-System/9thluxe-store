// integrations/commerce/types.ts
// Provider-independent commerce interfaces. Business modules depend ONLY on these interfaces,
// never directly on Shopify or Prisma. A registry selects the concrete adapter (local Postgres by
// default, Shopify when configured + feature-flagged).

export interface Money {
  amountNGN: number // whole naira
  currency: string
}

export interface CommerceVariant {
  id: string
  size: string | null
  price: Money
  compareAtPrice: Money | null
  sampleSize: boolean
  inStock: boolean
  availableQuantity: number | null
}

/** Public product DTO — safe to expose. Excludes cost/supplier/internal fields. */
export interface CommerceProduct {
  id: string
  shopifyId: string | null
  slug: string
  name: string
  brand: string | null
  description: string
  price: Money
  compareAtPrice: Money | null
  images: string[]
  fragranceFamily: string | null
  notesTop: string | null
  notesHeart: string | null
  notesBase: string | null
  concentration: string | null
  longevity: string | null
  sillage: string | null
  ratingAvg: number
  ratingCount: number
  inStock: boolean
  isNew: boolean
  isBestseller: boolean
  isLimited: boolean
  variants: CommerceVariant[]
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export interface CatalogQuery {
  q?: string
  brand?: string
  family?: string
  note?: string
  occasion?: string
  inStock?: boolean
  minPriceNGN?: number
  maxPriceNGN?: number
  cursor?: string
  limit?: number
}

export interface CommerceCatalogService {
  listProducts(query: CatalogQuery): Promise<Page<CommerceProduct>>
  getProductBySlug(slug: string): Promise<CommerceProduct | null>
  getProductById(id: string): Promise<CommerceProduct | null>
  listCollections(): Promise<{ id: string; slug: string; name: string }[]>
}

export interface CartLineInput {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface CommerceCart {
  id: string
  lines: Array<{
    productId: string
    variantId: string | null
    name: string
    quantity: number
    price: Money
  }>
  subtotal: Money
  discount: Money
  shipping: Money
  total: Money
  checkoutUrl: string | null
}

export interface CommerceCartService {
  getOrCreateCart(cartId?: string): Promise<CommerceCart>
  addLine(cartId: string, line: CartLineInput): Promise<CommerceCart>
  updateLine(cartId: string, line: CartLineInput): Promise<CommerceCart>
  removeLine(cartId: string, productId: string, variantId?: string | null): Promise<CommerceCart>
  /** Merge an anonymous cart into an authenticated one on sign-in. */
  merge(anonCartId: string, userCartId: string): Promise<CommerceCart>
}

export interface CommerceCustomer {
  id: string
  email: string
  name: string | null
}

export interface CommerceCustomerService {
  getByEmail(email: string): Promise<CommerceCustomer | null>
  ensure(email: string, name?: string | null): Promise<CommerceCustomer>
}

export interface CommerceOrderSummary {
  id: string
  reference: string | null
  status: string
  total: Money
  createdAt: string
}

export interface CommerceOrderService {
  getById(id: string): Promise<CommerceOrderSummary | null>
  listForCustomer(customerId: string): Promise<CommerceOrderSummary[]>
}

export interface InventoryLevel {
  productId: string
  variantId: string | null
  available: number
  reorderPoint: number | null
}

export interface CommerceInventoryService {
  getLevel(productId: string, variantId?: string | null): Promise<InventoryLevel | null>
  /** Authoritative revalidation used before checkout — never trust cached availability. */
  revalidate(lines: CartLineInput[]): Promise<
    Array<{ productId: string; variantId: string | null; requested: number; available: number; ok: boolean }>
  >
}

export interface PromotionValidation {
  ok: boolean
  discountNGN: number
  couponId?: string
  reasonCode?: string
}

export interface CommercePromotionService {
  validate(code: string, subtotalNGN: number): Promise<PromotionValidation>
}

/** The full commerce surface a provider must supply. */
export interface CommerceProvider {
  readonly name: 'local' | 'shopify'
  catalog: CommerceCatalogService
  cart: CommerceCartService
  customer: CommerceCustomerService
  order: CommerceOrderService
  inventory: CommerceInventoryService
  promotion: CommercePromotionService
}

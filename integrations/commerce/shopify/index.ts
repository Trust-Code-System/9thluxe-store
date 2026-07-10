// integrations/commerce/shopify/index.ts
// Shopify commerce provider (Storefront + Admin). Implements catalogue reads and cart handoff via
// the Storefront API. BLOCKED until SHOPIFY_* credentials + an approved product import exist; the
// registry only selects this provider when configured AND the `shopify_commerce` flag is on.
// Methods without a completed mapping throw AppError('FEATURE_DISABLED') rather than guessing.
import { AppError } from '@/lib/http/errors'
import { getCommerceConfig } from '@/lib/config/commerce'
import { shopifyGraphQL } from './client'
import type {
  CommerceProvider,
  CommerceProduct,
  Page,
  CatalogQuery,
  CommerceCart,
  CartLineInput,
} from '../types'

const CURRENCY = () => getCommerceConfig().shipping.currency

const PRODUCT_FIELDS = `
  id handle title vendor description
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  images(first: 8) { edges { node { url } } }
  variants(first: 20) { edges { node { id title availableForSale quantityAvailable price { amount } } } }
`

function mapNode(node: any): CommerceProduct {
  const amount = Math.round(Number(node?.priceRange?.minVariantPrice?.amount ?? 0))
  const compareAt = Math.round(Number(node?.compareAtPriceRange?.minVariantPrice?.amount ?? 0))
  const images = (node?.images?.edges ?? []).map((e: any) => e.node.url)
  const variants = (node?.variants?.edges ?? []).map((e: any) => ({
    id: e.node.id,
    size: e.node.title === 'Default Title' ? null : e.node.title,
    price: { amountNGN: Math.round(Number(e.node.price?.amount ?? 0)), currency: CURRENCY() },
    compareAtPrice: null,
    sampleSize: /sample/i.test(e.node.title ?? ''),
    inStock: !!e.node.availableForSale,
    availableQuantity: e.node.quantityAvailable ?? null,
  }))
  return {
    id: node.id,
    shopifyId: node.id,
    slug: node.handle,
    name: node.title,
    brand: node.vendor ?? null,
    description: node.description ?? '',
    price: { amountNGN: amount, currency: CURRENCY() },
    compareAtPrice: compareAt > amount ? { amountNGN: compareAt, currency: CURRENCY() } : null,
    images,
    fragranceFamily: null,
    notesTop: null,
    notesHeart: null,
    notesBase: null,
    concentration: null,
    longevity: null,
    sillage: null,
    ratingAvg: 0,
    ratingCount: 0,
    inStock: variants.some((v: any) => v.inStock),
    isNew: false,
    isBestseller: false,
    isLimited: false,
    variants,
  }
}

export const shopifyCommerce: CommerceProvider = {
  name: 'shopify',

  catalog: {
    async listProducts(query: CatalogQuery): Promise<Page<CommerceProduct>> {
      const first = Math.min(Math.max(query.limit ?? 24, 1), 60)
      const data = await shopifyGraphQL<any>(
        'storefront',
        `query($first:Int!,$after:String,$q:String){ products(first:$first, after:$after, query:$q){
          edges{ cursor node{ ${PRODUCT_FIELDS} } } pageInfo{ hasNextPage endCursor } } }`,
        { first, after: query.cursor ?? null, q: query.q ?? null },
      )
      const edges = data?.products?.edges ?? []
      return {
        items: edges.map((e: any) => mapNode(e.node)),
        nextCursor: data?.products?.pageInfo?.hasNextPage ? data.products.pageInfo.endCursor : null,
      }
    },
    async getProductBySlug(slug: string): Promise<CommerceProduct | null> {
      const data = await shopifyGraphQL<any>(
        'storefront',
        `query($handle:String!){ product(handle:$handle){ ${PRODUCT_FIELDS} } }`,
        { handle: slug },
      )
      return data?.product ? mapNode(data.product) : null
    },
    async getProductById(id: string): Promise<CommerceProduct | null> {
      const data = await shopifyGraphQL<any>(
        'storefront',
        `query($id:ID!){ product(id:$id){ ${PRODUCT_FIELDS} } }`,
        { id },
      )
      return data?.product ? mapNode(data.product) : null
    },
    async listCollections() {
      const data = await shopifyGraphQL<any>(
        'storefront',
        `query{ collections(first:50){ edges{ node{ id handle title } } } }`,
      )
      return (data?.collections?.edges ?? []).map((e: any) => ({ id: e.node.id, slug: e.node.handle, name: e.node.title }))
    },
  },

  cart: {
    async getOrCreateCart(): Promise<CommerceCart> {
      // Shopify cart create/query returns a checkoutUrl for handoff. Full mapping pending import.
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify cart mapping pending approved import' })
    },
    async addLine(): Promise<CommerceCart> {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify cart mapping pending approved import' })
    },
    async updateLine(): Promise<CommerceCart> {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify cart mapping pending approved import' })
    },
    async removeLine(): Promise<CommerceCart> {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify cart mapping pending approved import' })
    },
    async merge(): Promise<CommerceCart> {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify cart mapping pending approved import' })
    },
  },

  customer: {
    async getByEmail() {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify customer accounts pending config' })
    },
    async ensure() {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify customer accounts pending config' })
    },
  },

  order: {
    async getById() {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify orders pending admin config' })
    },
    async listForCustomer() {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify orders pending admin config' })
    },
  },

  inventory: {
    async getLevel() {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify inventory pending admin config' })
    },
    async revalidate(lines: CartLineInput[]) {
      // Falls back to marking unknown; callers should prefer local inventory until Shopify import.
      return lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, requested: l.quantity, available: 0, ok: false }))
    },
  },

  promotion: {
    async validate() {
      throw new AppError('FEATURE_DISABLED', { internal: 'shopify discounts pending config' })
    },
  },
}

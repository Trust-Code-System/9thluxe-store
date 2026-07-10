// app/api/v1/products/[slug]/route.ts
// GET /api/v1/products/:slug — single product by slug (envelope, 404 on miss).
import { route, raise } from '@/lib/http/handler'
import { getCommerce } from '@/integrations/registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async ({ req }) => {
  // Slug is the last path segment: /api/v1/products/<slug>
  const parts = req.nextUrl.pathname.split('/').filter(Boolean)
  const slug = decodeURIComponent(parts[parts.length - 1] ?? '')
  if (!slug) raise('VALIDATION_ERROR', 'Missing product slug.')

  const product = await getCommerce().catalog.getProductBySlug(slug)
  if (!product) raise('PRODUCT_NOT_FOUND')
  return { data: product }
})

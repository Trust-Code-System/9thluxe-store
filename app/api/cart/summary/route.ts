import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCart } from '@/components/cartActions'

export const runtime = 'nodejs'

export async function GET() {
  const cart = await getCart()
  if (!cart.length) {
    return NextResponse.json({ items: [], total: 0 })
  }

  const productIds = cart.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      priceNGN: true,
      brand: true,
      images: true,
    },
  })

  const map = new Map(products.map((product) => [product.id, product]))
  const items = cart
    .map((item) => {
      const product = map.get(item.productId)
      if (!product) return null
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: Array.isArray(product.images) ? product.images[0] || '/placeholder.png' : '/placeholder.png',
        quantity: item.quantity,
        priceNGN: product.priceNGN,
        lineTotal: product.priceNGN * item.quantity,
      }
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + item!.lineTotal, 0)

  return NextResponse.json({ items, total })
}

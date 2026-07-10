import { NextResponse } from 'next/server'
import { addToCart } from '@/components/cartActions'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { productId, quantity } = await request.json()
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Missing product ID' }, { status: 400 })
  }

  await addToCart(productId, Number(quantity) || 1)
  return NextResponse.json({ success: true })
}

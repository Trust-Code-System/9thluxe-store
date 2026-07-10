import { NextResponse } from 'next/server'
import { updateCartItem } from '@/components/cartActions'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { productId, quantity } = await request.json()
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Missing productId' }, { status: 400 })
  }
  await updateCartItem(productId, Number(quantity) || 1)
  return NextResponse.json({ success: true })
}

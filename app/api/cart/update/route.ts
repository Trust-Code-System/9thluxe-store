import { NextResponse } from 'next/server'
import { updateCartItem, removeFromCart } from '@/components/cartActions'
import { clientIp, consumeRateLimit } from '@/lib/middleware/limiter'
import { hasTrustedOrigin } from '@/lib/security/origin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const limit = await consumeRateLimit(`cart:${clientIp(request)}`, 120, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json({ success: false, error: 'Too many cart updates' }, { status: 429 })
  }
  const { productId, quantity } = await request.json()
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Missing productId' }, { status: 400 })
  }
  const qty = Number(quantity)
  if (qty <= 0) {
    await removeFromCart(productId)
  } else {
    await updateCartItem(productId, qty)
  }
  return NextResponse.json({ success: true })
}

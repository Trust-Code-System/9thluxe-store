import { NextResponse } from 'next/server'
import { addToCart } from '@/components/cartActions'
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
    return NextResponse.json({ success: false, error: 'Missing product ID' }, { status: 400 })
  }

  await addToCart(productId, Number(quantity) || 1)
  return NextResponse.json({ success: true })
}

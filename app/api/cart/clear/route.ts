import { NextResponse } from 'next/server'
import { clearCart } from '@/components/cartActions'
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
  await clearCart()
  return NextResponse.json({ success: true })
}

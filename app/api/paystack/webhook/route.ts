// app/api/paystack/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendReceipt } from '@/emails/sendReceipt'
import { recordWebhookOnce } from '@/lib/webhooks/idempotency'
import { resolveLoyaltyTier } from '@/lib/config/commerce'
import { pointsForOrder } from '@/lib/loyalty/points'

function verify(reqBody: string, signature?: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY || ''
  if (!secret || !signature) return false
  const hash = crypto.createHmac('sha512', secret).update(reqBody).digest('hex')
  return hash === signature
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-paystack-signature') || undefined
  if (!verify(raw, signature)) return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })

  const evt = JSON.parse(raw)
  if (evt?.event === 'charge.success') {
    const ref = evt?.data?.reference as string | undefined
    const orderId = evt?.data?.metadata?.orderId as string | undefined

    // Durable replay protection: process each event id at most once.
    const eventId = String(evt?.id ?? evt?.data?.id ?? ref ?? orderId ?? '')
    if (eventId) {
      const first = await recordWebhookOnce('paystack', eventId, evt.event)
      if (!first) return NextResponse.json({ ok: true })
    }

    if (orderId) {
      // Fetch order items first so we can decrement stock
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, couponId: true, items: { select: { productId: true, quantity: true } } },
      })

      // Guard: skip if already paid (duplicate webhook)
      if (!existingOrder || existingOrder.status === 'PAID') {
        return NextResponse.json({ ok: true })
      }

      // Atomically: mark PAID, decrement stock, increment coupon usage, update loyalty
      const order = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status: 'PAID', reference: ref ?? null },
          include: { user: true, items: { include: { product: true } }, coupon: true },
        })

        // Decrement stock for each ordered product
        await Promise.all(
          existingOrder.items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          )
        )

        // Increment coupon usage if one was applied
        if (existingOrder.couponId) {
          await tx.coupon.update({
            where: { id: existingOrder.couponId },
            data: { usedCount: { increment: 1 } },
          })
        }

        // Update user loyalty tier and lifetime spend (thresholds from commerce config)
        const updatedUser = await tx.user.update({
          where: { id: updated.userId },
          data: { totalLifetimeSpend: { increment: updated.totalNGN } },
          select: { totalLifetimeSpend: true },
        })
        await tx.user.update({
          where: { id: updated.userId },
          data: { loyaltyTier: resolveLoyaltyTier(updatedUser.totalLifetimeSpend) },
        })

        // Accrue loyalty points (earning is always recorded; redemption stays flag-gated).
        // Idempotent: the already-PAID + WebhookReceipt guards prevent double-earn.
        const points = pointsForOrder(updated.totalNGN)
        if (points > 0) {
          const prior = await tx.loyaltyLedger.aggregate({
            where: { userId: updated.userId },
            _sum: { delta: true },
          })
          const balanceAfter = (prior._sum.delta ?? 0) + points
          await tx.loyaltyLedger.create({
            data: { userId: updated.userId, delta: points, reason: 'order_earn', balanceAfter, orderId: updated.id },
          })
        }

        return updated
      })

      // send receipt (best-effort)
      await sendReceipt(order).catch(() => {})

      // Create notification for admin
      await prisma.notification.create({
        data: {
          type: 'ORDER_PAID',
          title: 'New Order Payment',
          message: `Order #${order.reference || order.id.slice(0, 8)} has been paid. Total: ₦${order.totalNGN.toLocaleString()}`,
          orderId: order.id,
        }
      }).catch(() => {}) // Don't fail if notification creation fails
    }
  }

  return NextResponse.json({ ok: true })
}

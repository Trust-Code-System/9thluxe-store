// lib/notifications/dispatch.ts
// High-level notification dispatch keyed by domain event. Builds a safe NotificationMessage, looks
// up the recipient's consent + channel preferences from the User record, and delegates to the
// consent/quiet-hours/dedup-aware notifier. Never throws into the caller's critical path.
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/observability/logger'
import { notify, type Consent } from '@/integrations/notifications'
import type { NotificationChannel, NotificationEvent, NotificationKind, DeliveryResult } from '@/integrations/notifications/types'

interface EventSpec {
  kind: NotificationKind
  channels: NotificationChannel[]
  subject: (data: Record<string, unknown>) => string
  body: (data: Record<string, unknown>) => string
}

// Transactional events always include in_app; promotional ones require consent (enforced in notify).
const EVENT_SPECS: Record<NotificationEvent, EventSpec> = {
  order_received: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'We received your order', body: (d) => `Your order ${d.orderRef ?? ''} has been received.` },
  payment_confirmed: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Payment confirmed', body: (d) => `We've confirmed payment for order ${d.orderRef ?? ''}.` },
  payment_failed: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Payment could not be completed', body: (d) => `Payment for order ${d.orderRef ?? ''} did not go through.` },
  order_shipped: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Your order has shipped', body: (d) => `Order ${d.orderRef ?? ''} is on its way.` },
  delivery_exception: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Delivery update', body: (d) => `There's an update on the delivery of order ${d.orderRef ?? ''}.` },
  delivered: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Delivered', body: (d) => `Order ${d.orderRef ?? ''} has been delivered.` },
  return_received: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Return received', body: () => `We've received your return.` },
  refund_status: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Refund update', body: (d) => `Your refund status: ${d.status ?? 'processing'}.` },
  back_in_stock: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Back in stock', body: (d) => `${d.productName ?? 'A fragrance you wanted'} is back in stock.` },
  waitlist_available: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'Your waitlist item is available', body: (d) => `${d.productName ?? 'Your waitlist item'} is now available.` },
  discovery_set_credit: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'You have a sample credit', body: (d) => `A sample credit of ₦${d.amountNGN ?? ''} is available on your account.` },
  review_request: { kind: 'transactional', channels: ['email', 'in_app'], subject: () => 'How was your fragrance?', body: (d) => `Tell us what you thought of ${d.productName ?? 'your recent purchase'}.` },
  abandoned_checkout: { kind: 'promotional', channels: ['email', 'in_app'], subject: () => 'You left something behind', body: () => `Your cart is still waiting for you.` },
  concierge_handoff: { kind: 'transactional', channels: ['in_app'], subject: () => 'A specialist will follow up', body: () => `Your concierge request has been escalated to a human specialist.` },
  limited_drop: { kind: 'promotional', channels: ['email', 'whatsapp', 'in_app'], subject: () => 'Limited drop', body: (d) => `${d.productName ?? 'A limited fragrance'} is dropping soon.` },
}

export interface DispatchInput {
  event: NotificationEvent
  dedupeKey: string
  to: { email?: string; phone?: string; userId?: string }
  data?: Record<string, unknown>
  localHour?: number
}

async function resolveConsent(userId?: string): Promise<Consent> {
  if (!userId) return {}
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { marketingEmails: true, smsNotifications: true } })
    if (!user) return {}
    return { marketingEmail: user.marketingEmails, marketingSms: user.smsNotifications, marketingWhatsapp: false }
  } catch {
    return {}
  }
}

export async function dispatchNotificationEvent(input: DispatchInput): Promise<DeliveryResult[]> {
  const spec = EVENT_SPECS[input.event]
  const data = input.data ?? {}
  try {
    const consent = await resolveConsent(input.to.userId)
    return await notify(
      {
        event: input.event,
        kind: spec.kind,
        to: input.to,
        subject: spec.subject(data),
        body: spec.body(data),
        dedupeKey: input.dedupeKey,
        data,
      },
      spec.channels,
      { consent, localHour: input.localHour },
    )
  } catch (e) {
    logger.error('dispatch_notification_failed', { event: input.event, internal: String(e) })
    return []
  }
}

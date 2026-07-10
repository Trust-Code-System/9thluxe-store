// integrations/notifications/types.ts
// Notification provider interfaces. Marketing messages require stored consent; transactional
// messages do not. WhatsApp promotional messages are NEVER sent without valid consent.
export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app'
export type NotificationKind = 'transactional' | 'promotional'

export type NotificationEvent =
  | 'order_received'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'order_shipped'
  | 'delivery_exception'
  | 'delivered'
  | 'return_received'
  | 'refund_status'
  | 'back_in_stock'
  | 'waitlist_available'
  | 'discovery_set_credit'
  | 'review_request'
  | 'abandoned_checkout'
  | 'concierge_handoff'
  | 'limited_drop'

export interface NotificationMessage {
  event: NotificationEvent
  kind: NotificationKind
  to: { email?: string; phone?: string; userId?: string }
  subject?: string
  body: string
  /** Idempotency/dedup key; the same key is not delivered twice. */
  dedupeKey: string
  data?: Record<string, unknown>
}

export interface DeliveryResult {
  channel: NotificationChannel
  ok: boolean
  skippedReason?: 'no_consent' | 'no_address' | 'not_configured' | 'duplicate' | 'quiet_hours'
  providerId?: string
}

export interface ChannelAdapter {
  readonly channel: NotificationChannel
  readonly configured: boolean
  send(message: NotificationMessage): Promise<DeliveryResult>
}

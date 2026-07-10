// lib/analytics/events.ts
// Typed first-party analytics events. Operational events (payment/order) are kept distinct
// from marketing analytics so they can be routed to different sinks with different consent rules.
// This module only DEFINES and validates events; a sink adapter dispatches them.
import { z } from 'zod'

export type EventCategory = 'operational' | 'marketing' | 'concierge'

const base = z.object({
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  ts: z.string().datetime().optional(),
})

export const EventSchemas = {
  product_viewed: base.extend({ productId: z.string(), slug: z.string().optional() }),
  search_submitted: base.extend({ query: z.string(), resultCount: z.number().int().optional() }),
  search_result_clicked: base.extend({ query: z.string(), productId: z.string(), position: z.number().int().optional() }),
  filter_applied: base.extend({ filters: z.record(z.string(), z.unknown()) }),
  quiz_started: base.extend({ quizVersion: z.string() }),
  quiz_completed: base.extend({ quizVersion: z.string(), sessionId: z.string() }),
  recommendation_produced: base.extend({ requestId: z.string(), productIds: z.array(z.string()) }),
  recommendation_clicked: base.extend({ productId: z.string() }),
  recommendation_rejected: base.extend({ productId: z.string(), reason: z.string().optional() }),
  product_compared: base.extend({ productIds: z.array(z.string()) }),
  sample_added: base.extend({ productId: z.string(), variantId: z.string().optional() }),
  product_added_to_cart: base.extend({ productId: z.string(), quantity: z.number().int() }),
  checkout_started: base.extend({ cartTotalNGN: z.number().int() }),
  payment_verified: base.extend({ orderId: z.string(), reference: z.string() }),
  order_completed: base.extend({ orderId: z.string(), totalNGN: z.number().int() }),
  back_in_stock_requested: base.extend({ productId: z.string() }),
  gift_concierge_completed: base.extend({ sessionId: z.string() }),
  layering_combination_saved: base.extend({ productIds: z.array(z.string()) }),
  review_submitted: base.extend({ productId: z.string(), rating: z.number().int() }),
  support_escalated: base.extend({ conversationId: z.string() }),
} as const

export type EventName = keyof typeof EventSchemas
export type EventPayload<N extends EventName> = z.infer<(typeof EventSchemas)[N]>

export const EVENT_CATEGORY: Record<EventName, EventCategory> = {
  product_viewed: 'operational',
  search_submitted: 'operational',
  search_result_clicked: 'operational',
  filter_applied: 'operational',
  quiz_started: 'concierge',
  quiz_completed: 'concierge',
  recommendation_produced: 'concierge',
  recommendation_clicked: 'concierge',
  recommendation_rejected: 'concierge',
  product_compared: 'operational',
  sample_added: 'operational',
  product_added_to_cart: 'operational',
  checkout_started: 'operational',
  payment_verified: 'operational',
  order_completed: 'operational',
  back_in_stock_requested: 'operational',
  gift_concierge_completed: 'concierge',
  layering_combination_saved: 'concierge',
  review_submitted: 'operational',
  support_escalated: 'operational',
}

/** Validate an event payload against its schema. Throws ZodError on mismatch. */
export function validateEvent<N extends EventName>(name: N, payload: unknown): EventPayload<N> {
  return EventSchemas[name].parse(payload) as EventPayload<N>
}

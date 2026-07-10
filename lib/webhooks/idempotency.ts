// lib/webhooks/idempotency.ts
// Durable webhook idempotency + replay protection backed by the WebhookReceipt table
// (unique [provider, eventId]). Call recordWebhookOnce() after signature verification and before
// applying side-effects: it returns true exactly once per (provider, eventId).
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/observability/logger'

/**
 * Returns true if this (provider, eventId) is seen for the first time (=> process it), false if it
 * was already recorded (=> replay/duplicate, skip side-effects). Fails open-safe: on unexpected DB
 * error it returns true and logs, so a transient DB blip never silently drops a real event.
 */
export async function recordWebhookOnce(
  provider: string,
  eventId: string,
  topic?: string,
): Promise<boolean> {
  try {
    await prisma.webhookReceipt.create({ data: { provider, eventId, topic: topic ?? null } })
    return true
  } catch (e) {
    // Unique-constraint violation (P2002) => already processed.
    if ((e as { code?: string })?.code === 'P2002') {
      logger.info('webhook_replay_skipped', { provider, topic })
      return false
    }
    logger.error('webhook_idempotency_error', { provider, topic, internal: String(e) })
    return true
  }
}

/** Mark a previously-recorded receipt as processed (for observability / reprocessing tooling). */
export async function markWebhookProcessed(provider: string, eventId: string): Promise<void> {
  await prisma.webhookReceipt
    .update({ where: { provider_eventId: { provider, eventId } }, data: { processedAt: new Date() } })
    .catch(() => {})
}

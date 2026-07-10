// integrations/notifications/index.ts
// Consent-aware, quiet-hours-aware, durably-deduplicated notification dispatch.
//  - Transactional messages ignore marketing consent and quiet hours (order/payment/shipping).
//  - Promotional messages require the recipient's channel consent AND respect quiet hours.
//  - Dedup is durable: a NotificationLog row keyed by (dedupeKey per channel) prevents double-sends
//    across process restarts and serverless instances.
import { logger } from '@/lib/observability/logger'
import { emailAdapter, whatsappAdapter, smsAdapter, inAppAdapter } from './adapters'
import type { ChannelAdapter, NotificationChannel, NotificationMessage, DeliveryResult } from './types'

const ADAPTERS: Record<NotificationChannel, ChannelAdapter> = {
  email: emailAdapter,
  whatsapp: whatsappAdapter,
  sms: smsAdapter,
  in_app: inAppAdapter,
}

export interface Consent {
  marketingEmail?: boolean
  marketingWhatsapp?: boolean
  marketingSms?: boolean
}

export interface NotifyOptions {
  consent?: Consent
  /** Local hour (0-23) at the recipient. When provided, promotional sends are held during quiet hours. */
  localHour?: number
  /** Inclusive quiet-hours window [start, end) in local hours. Default 21:00–08:00. */
  quietHours?: { start: number; end: number }
}

export function inQuietHours(hour: number, window: { start: number; end: number }): boolean {
  const { start, end } = window
  if (start === end) return false
  // Window may wrap past midnight (e.g. 21 -> 8).
  return start < end ? hour >= start && hour < end : hour >= start || hour < end
}

/** Durable, per-channel dedup + status record. Returns false if this (dedupeKey,channel) was seen. */
async function recordAttempt(
  message: NotificationMessage,
  channel: NotificationChannel,
): Promise<{ first: boolean }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.notificationLog.create({
      data: {
        event: message.event,
        channel,
        kind: message.kind,
        dedupeKey: `${message.dedupeKey}:${channel}`,
        recipient: message.to.email ?? message.to.phone ?? message.to.userId ?? null,
        status: 'pending',
      },
    })
    return { first: true }
  } catch {
    // Unique violation on dedupeKey => already attempted; treat as duplicate.
    return { first: false }
  }
}

async function updateLog(dedupeKey: string, channel: NotificationChannel, patch: { status: string; skipReason?: string; providerId?: string }) {
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.notificationLog.updateMany({
      where: { dedupeKey: `${dedupeKey}:${channel}` },
      data: { status: patch.status, skipReason: patch.skipReason ?? null, providerId: patch.providerId ?? null },
    })
  } catch {
    /* best-effort */
  }
}

export async function notify(
  message: NotificationMessage,
  channels: NotificationChannel[],
  options: NotifyOptions = {},
): Promise<DeliveryResult[]> {
  const consent = options.consent ?? {}
  const quietHours = options.quietHours ?? { start: 21, end: 8 }
  const results: DeliveryResult[] = []

  for (const channel of channels) {
    // Consent + quiet-hours gates for promotional messages.
    if (message.kind === 'promotional') {
      const allowed =
        (channel === 'email' && consent.marketingEmail) ||
        (channel === 'whatsapp' && consent.marketingWhatsapp) ||
        (channel === 'sms' && consent.marketingSms) ||
        channel === 'in_app'
      if (!allowed) {
        results.push({ channel, ok: false, skippedReason: 'no_consent' })
        continue
      }
      if (channel !== 'in_app' && options.localHour != null && inQuietHours(options.localHour, quietHours)) {
        results.push({ channel, ok: false, skippedReason: 'quiet_hours' })
        continue
      }
    }

    // Durable dedup.
    const { first } = await recordAttempt(message, channel)
    if (!first) {
      results.push({ channel, ok: false, skippedReason: 'duplicate' })
      continue
    }

    const adapter = ADAPTERS[channel]
    const result = await adapter.send(message)
    results.push(result)
    await updateLog(message.dedupeKey, channel, {
      status: result.ok ? 'sent' : result.skippedReason ? 'skipped' : 'failed',
      skipReason: result.skippedReason,
      providerId: result.providerId,
    })
  }

  logger.info('notify_dispatched', {
    event: message.event,
    kind: message.kind,
    channels,
    results: results.map((r) => ({ c: r.channel, ok: r.ok, skip: r.skippedReason })),
  })
  return results
}

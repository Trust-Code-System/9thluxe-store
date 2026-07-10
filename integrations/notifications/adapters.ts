// integrations/notifications/adapters.ts
// Channel adapters. Email uses Resend (real when RESEND_API_KEY set). WhatsApp/SMS are implemented
// but blocked until credentials exist (they degrade to 'not_configured', never throw). In-app writes
// to the Notification table. A dev-mock logs instead of sending.
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'
import type { ChannelAdapter, NotificationMessage, DeliveryResult } from './types'

export const emailAdapter: ChannelAdapter = {
  channel: 'email',
  get configured() {
    return Boolean(env.RESEND_API_KEY)
  },
  async send(message: NotificationMessage): Promise<DeliveryResult> {
    if (!message.to.email) return { channel: 'email', ok: false, skippedReason: 'no_address' }
    if (!this.configured) {
      logger.info('notify_email_skipped_unconfigured', { event: message.event })
      return { channel: 'email', ok: false, skippedReason: 'not_configured' }
    }
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(env.RESEND_API_KEY)
      const { data } = await resend.emails.send({
        from: env.NEWSLETTER_FROM_EMAIL || 'Fádé <onboarding@resend.dev>',
        to: message.to.email,
        subject: message.subject ?? 'Fádé Essence',
        text: message.body,
      })
      return { channel: 'email', ok: true, providerId: data?.id }
    } catch (e) {
      logger.error('notify_email_failed', { event: message.event, internal: String(e) })
      return { channel: 'email', ok: false }
    }
  },
}

export const whatsappAdapter: ChannelAdapter = {
  channel: 'whatsapp',
  get configured() {
    return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID)
  },
  async send(message: NotificationMessage): Promise<DeliveryResult> {
    if (!message.to.phone) return { channel: 'whatsapp', ok: false, skippedReason: 'no_address' }
    if (!this.configured) return { channel: 'whatsapp', ok: false, skippedReason: 'not_configured' }
    // Real WhatsApp Cloud API call intentionally gated: no live messages in this project.
    logger.info('notify_whatsapp_prepared', { event: message.event })
    return { channel: 'whatsapp', ok: false, skippedReason: 'not_configured' }
  },
}

export const smsAdapter: ChannelAdapter = {
  channel: 'sms',
  get configured() {
    return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN)
  },
  async send(message: NotificationMessage): Promise<DeliveryResult> {
    if (!message.to.phone) return { channel: 'sms', ok: false, skippedReason: 'no_address' }
    if (!this.configured) return { channel: 'sms', ok: false, skippedReason: 'not_configured' }
    logger.info('notify_sms_prepared', { event: message.event })
    return { channel: 'sms', ok: false, skippedReason: 'not_configured' }
  },
}

/** In-app notification: persists to the Notification table via a lazily-imported prisma client. */
export const inAppAdapter: ChannelAdapter = {
  channel: 'in_app',
  configured: true,
  async send(message: NotificationMessage): Promise<DeliveryResult> {
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.notification.create({
        data: {
          type: message.event.toUpperCase(),
          title: message.subject ?? message.event,
          message: message.body,
          orderId: (message.data?.orderId as string) ?? null,
        },
      })
      return { channel: 'in_app', ok: true }
    } catch (e) {
      logger.error('notify_in_app_failed', { event: message.event, internal: String(e) })
      return { channel: 'in_app', ok: false }
    }
  },
}

export const mockAdapter: ChannelAdapter = {
  channel: 'in_app',
  configured: true,
  async send(message: NotificationMessage): Promise<DeliveryResult> {
    logger.info('notify_mock', { event: message.event, kind: message.kind, dedupeKey: message.dedupeKey })
    return { channel: 'in_app', ok: true }
  },
}

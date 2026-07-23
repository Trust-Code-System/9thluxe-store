import crypto from "node:crypto"

import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"
import { createContactSubmission } from "@/lib/forms/submissions"

import { clientIp, consumeRateLimit } from "@/lib/middleware/limiter"
import {
  emailSchema,
  nameSchema,
  validateAndSanitize,
} from "@/lib/middleware/validate-input"
import {
  renderContactOwnerEmail,
  renderContactReplyEmail,
} from "@/lib/notifications/contact-email"
import { logger } from "@/lib/observability/logger"
import { hasTrustedOrigin } from "@/lib/security/origin"

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message too short").max(5000),
}).strict()

const STORE_EMAIL = "fadeessencee@gmail.com"
const FROM_EMAIL =
  process.env.NEWSLETTER_FROM_EMAIL ||
  "Fade Essence <onboarding@resend.dev>"

export async function POST(req: NextRequest) {
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json(
        { error: "Request origin could not be verified" },
        { status: 403 },
      )
    }

    const ipLimit = await consumeRateLimit(
      `contact:ip:${clientIp(req)}`,
      5,
      60 * 60 * 1000,
    )
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 },
      )
    }

    const validated = validateAndSanitize(contactSchema, await req.json())
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error },
        { status: 400 },
      )
    }

    const { name, email, subject, message } = validated.data
    const normalizedEmail = email.toLowerCase().trim()
    const emailHash = crypto
      .createHash("sha256")
      .update(normalizedEmail)
      .digest("hex")
    const emailLimit = await consumeRateLimit(
      `contact:email:${emailHash}`,
      3,
      60 * 60 * 1000,
    )
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 },
      )
    }

    // Keep the existing email flow operational during the staged migration rollout. Once the
    // FormSubmission migration is applied, every valid contact request is durably captured here.
    try {
      await createContactSubmission({ name, email, subject, message })
    } catch (error) {
      console.error("[CONTACT] Failed to persist submission:", error)
      // P2021 means the additive table has not been approved/applied yet; preserve the existing
      // email-only service during that rollout window. Other DB failures must not claim success.
      if ((error as { code?: string }).code !== "P2021") {
        return NextResponse.json({ error: "We could not save your message. Please try again." }, { status: 503 })
      }
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails
        .send({
          from: FROM_EMAIL,
          to: STORE_EMAIL,
          replyTo: normalizedEmail,
          subject: `Contact Form: ${subject}`,
          html: renderContactOwnerEmail({
            name,
            email: normalizedEmail,
            subject,
            message,
          }),
        })
        .catch((error) =>
          logger.error("contact_owner_email_failed", {
            internal: String(error),
          }),
        )

      await resend.emails
        .send({
          from: FROM_EMAIL,
          to: normalizedEmail,
          subject: "We received your message - Fade Essence",
          html: renderContactReplyEmail({ name, message }, STORE_EMAIL),
        })
        .catch((error) =>
          logger.error("contact_reply_email_failed", {
            internal: String(error),
          }),
        )
    } else {
      logger.warn("contact_email_skipped", {
        reason: "RESEND_API_KEY missing",
      })
    }

    return NextResponse.json({
      message: "Thank you for contacting us! We'll get back to you soon.",
    })
  } catch (error) {
    logger.error("contact_request_failed", { internal: String(error) })
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    )
  }
}

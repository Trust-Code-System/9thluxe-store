import crypto from "crypto"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

import {
  generatePasswordResetToken,
  passwordResetExpiry,
  passwordResetTokenHash,
} from "@/lib/auth/password-reset"
import { env } from "@/lib/env"
import { consumeRateLimit, clientIp } from "@/lib/middleware/limiter"
import { logger } from "@/lib/observability/logger"
import { prisma } from "@/lib/prisma"
import { hasTrustedOrigin } from "@/lib/security/origin"
import { escapeHtml } from "@/lib/security/html"

export const runtime = "nodejs"

const RequestSchema = z.object({
  email: z.string().trim().email().max(254),
}).strict()

const GENERIC_MESSAGE =
  "If an account exists for this email, a reset link has been sent."

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json({ error: "Request origin could not be verified" }, { status: 403 })
    }
    const parsed = RequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 })
    }

    const normalizedEmail = parsed.data.email.toLowerCase()
    const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex")
    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit(`password-reset:ip:${clientIp(request)}`, 5, 60 * 60 * 1000),
      consumeRateLimit(`password-reset:email:${emailHash}`, 3, 60 * 60 * 1000),
    ])
    if (!ipLimit.ok || !emailLimit.ok) {
      return NextResponse.json({ message: GENERIC_MESSAGE })
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, email: true, name: true },
    })
    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE })
    }

    const token = generatePasswordResetToken()
    const tokenHash = passwordResetTokenHash(token)
    const resetRecord = await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash,
        expiresAt: passwordResetExpiry(),
        usedAt: null,
        createdAt: new Date(),
      },
      create: {
        userId: user.id,
        tokenHash,
        expiresAt: passwordResetExpiry(),
      },
      select: { id: true },
    })

    const resetUrl = `${env.APP_URL.replace(/\/$/, "")}/auth/reset?token=${encodeURIComponent(token)}`
    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY)
      const safeName = escapeHtml(user.name || "Customer")
      const safeUrl = escapeHtml(resetUrl)
      await resend.emails
        .send(
          {
            from:
              env.NEWSLETTER_FROM_EMAIL ||
              "Fádé Essence <onboarding@resend.dev>",
            to: user.email,
            subject: "Reset your Fádé Essence password",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Password reset request</h2>
                <p>Hello ${safeName},</p>
                <p>Use the link below to set a new password. It expires in one hour and can only be used once.</p>
                <p><a href="${safeUrl}">Reset password</a></p>
                <p>If you did not request this change, you can ignore this email.</p>
              </div>
            `,
          },
          { idempotencyKey: `password-reset:${resetRecord.id}` },
        )
        .catch((error) => {
          logger.error("password_reset_email_failed", {
            userId: user.id,
            internal: String(error),
          })
        })
    } else {
      logger.warn("password_reset_email_skipped", {
        userId: user.id,
        reason: "RESEND_API_KEY missing",
      })
    }

    return NextResponse.json({ message: GENERIC_MESSAGE })
  } catch (error) {
    logger.error("password_reset_request_failed", { internal: String(error) })
    return NextResponse.json(
      { error: "Failed to process reset request" },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { z } from "zod"

import {
  consumePasswordResetToken,
  newPasswordSchema,
} from "@/lib/auth/password-reset"
import { consumeRateLimit, clientIp } from "@/lib/middleware/limiter"
import { logger } from "@/lib/observability/logger"
import { hasTrustedOrigin } from "@/lib/security/origin"

export const runtime = "nodejs"

const ConfirmSchema = z.object({
  token: z.string().min(32).max(128),
  password: newPasswordSchema,
}).strict()

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json({ error: "Request origin could not be verified" }, { status: 403 })
    }
    const limit = await consumeRateLimit(
      `password-reset:confirm:${clientIp(request)}`,
      10,
      60 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait and try again." },
        { status: 429 },
      )
    }

    const parsed = ConfirmSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "The reset link or password is invalid" },
        { status: 400 },
      )
    }
    const changed = await consumePasswordResetToken(
      parsed.data.token,
      parsed.data.password,
    )

    if (!changed) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired" },
        { status: 400 },
      )
    }
    return NextResponse.json({ message: "Your password has been updated" })
  } catch (error) {
    logger.error("password_reset_confirmation_failed", {
      internal: String(error),
    })
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    )
  }
}

import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { newPasswordSchema } from "@/lib/auth/password-reset"
import { consumeRateLimit, clientIp } from "@/lib/middleware/limiter"
import { logger } from "@/lib/observability/logger"
import { prisma } from "@/lib/prisma"
import { toSafeAuthErrorMessage } from "@/lib/prisma-error"
import { generateReferralCode } from "@/lib/referrals/code"
import { attributeReferral } from "@/lib/referrals/service"
import { hasTrustedOrigin } from "@/lib/security/origin"

const RegisterSchema = z.object({
  email: z.string().trim().email().max(254),
  password: newPasswordSchema,
  name: z.string().trim().max(120).optional(),
  referredBy: z.string().trim().max(100).optional(),
}).strict()

export async function POST(req: NextRequest) {
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ error: "Request origin could not be verified" }, { status: 403 })
    }
    const limit = await consumeRateLimit(
      `signup:ip:${clientIp(req)}`,
      5,
      60 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait and try again." },
        { status: 429 },
      )
    }
    const parsed = RegisterSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid email and a password of at least 8 characters are required" },
        { status: 400 },
      )
    }
    const email = parsed.data.email.toLowerCase()
    const exists = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    })
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }
    const hash = await bcrypt.hash(parsed.data.password, 12)

    let referralCode = generateReferralCode()
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const existing = await prisma.user.findUnique({ where: { referralCode } })
      if (!existing) break
      referralCode = generateReferralCode()
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name || null,
        passwordHash: hash,
        referralCode,
      },
    })
    if (parsed.data.referredBy) {
      await attributeReferral(user.id, parsed.data.referredBy).catch(() => null)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("registration_failed", { internal: String(error) })
    return NextResponse.json(
      { error: toSafeAuthErrorMessage(error) },
      { status: 500 },
    )
  }
}

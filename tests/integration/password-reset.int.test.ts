import bcrypt from "bcryptjs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  consumePasswordResetToken,
  passwordResetTokenHash,
} from "@/lib/auth/password-reset"
import { prisma } from "@/lib/prisma"

const hasDb = Boolean(process.env.DATABASE_URL)
const tag = `password_reset_itest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

describe.skipIf(!hasDb)("password reset token lifecycle (DB)", () => {
  let userId = ""

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${tag}@example.test`,
        passwordHash: await bcrypt.hash("old-password", 4),
      },
      select: { id: true },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {})
  })

  it("changes the password once and rejects replay", async () => {
    const token = `token_${tag}`
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: passwordResetTokenHash(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    })

    expect(await consumePasswordResetToken(token, "new-password")).toBe(true)
    expect(await consumePasswordResetToken(token, "other-password")).toBe(false)

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    })
    expect(await bcrypt.compare("new-password", user.passwordHash)).toBe(true)
    expect(await bcrypt.compare("other-password", user.passwordHash)).toBe(false)
  })

  it("rejects expired tokens without changing the password", async () => {
    const token = `expired_${tag}`
    await prisma.passwordResetToken.update({
      where: { userId },
      data: {
        tokenHash: passwordResetTokenHash(token),
        expiresAt: new Date(Date.now() - 60_000),
        usedAt: null,
      },
    })
    expect(await consumePasswordResetToken(token, "expired-password")).toBe(false)
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    })
    expect(await bcrypt.compare("new-password", user.passwordHash)).toBe(true)
  })
})

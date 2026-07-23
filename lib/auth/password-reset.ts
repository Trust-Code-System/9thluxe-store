import crypto from "crypto"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

export const newPasswordSchema = z.string().min(8).max(128)

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

export function passwordResetTokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function passwordResetExpiry(now = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MS)
}

export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
  now = new Date(),
): Promise<boolean> {
  const tokenHash = passwordResetTokenHash(token)
  const passwordHash = await bcrypt.hash(newPassword, 12)

  return prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    })
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) return false

    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    })
    if (consumed.count !== 1) return false

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })
    await tx.session.deleteMany({ where: { userId: resetToken.userId } })
    return true
  })
}

import { describe, expect, it } from "vitest"

import {
  generatePasswordResetToken,
  newPasswordSchema,
  PASSWORD_RESET_TTL_MS,
  passwordResetExpiry,
  passwordResetTokenHash,
} from "@/lib/auth/password-reset"

describe("password reset primitives", () => {
  it("generates opaque tokens and stores only a deterministic hash", () => {
    const token = generatePasswordResetToken()
    const second = generatePasswordResetToken()
    expect(token).not.toBe(second)
    expect(token.length).toBeGreaterThanOrEqual(40)
    expect(passwordResetTokenHash(token)).toMatch(/^[a-f0-9]{64}$/)
    expect(passwordResetTokenHash(token)).not.toContain(token)
  })

  it("expires tokens after one hour", () => {
    const now = new Date("2026-07-23T12:00:00.000Z")
    expect(passwordResetExpiry(now).getTime() - now.getTime()).toBe(
      PASSWORD_RESET_TTL_MS,
    )
  })

  it("enforces the shared password length policy", () => {
    expect(newPasswordSchema.safeParse("short").success).toBe(false)
    expect(newPasswordSchema.safeParse("long-enough").success).toBe(true)
    expect(newPasswordSchema.safeParse("x".repeat(129)).success).toBe(false)
  })
})

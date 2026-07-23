import { afterEach, describe, expect, it } from "vitest"

import { getEnvDiagnostics } from "@/lib/env-diagnostics"

const keys = [
  "NODE_ENV",
  "PAYMENTS_ENABLED",
  "PAYSTACK_SECRET_KEY",
  "PAYSTACK_PUBLIC_KEY",
] as const
const mutableEnv = process.env as Record<string, string | undefined>
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of keys) {
    const value = original[key]
    if (value === undefined) delete process.env[key]
    else mutableEnv[key] = value
  }
})

describe("production payment environment diagnostics", () => {
  it("does not require Paystack credentials while collection is disabled", () => {
    mutableEnv.NODE_ENV = "production"
    process.env.PAYMENTS_ENABLED = "false"
    delete process.env.PAYSTACK_SECRET_KEY
    delete process.env.PAYSTACK_PUBLIC_KEY

    const result = getEnvDiagnostics()
    expect(result.missingCritical).not.toContain("PAYSTACK_SECRET_KEY")
    expect(result.missingCritical).not.toContain("PAYSTACK_PUBLIC_KEY")
  })

  it("requires both Paystack credentials when collection is enabled", () => {
    mutableEnv.NODE_ENV = "production"
    process.env.PAYMENTS_ENABLED = "true"
    delete process.env.PAYSTACK_SECRET_KEY
    delete process.env.PAYSTACK_PUBLIC_KEY

    const result = getEnvDiagnostics()
    expect(result.missingCritical).toContain("PAYSTACK_SECRET_KEY")
    expect(result.missingCritical).toContain("PAYSTACK_PUBLIC_KEY")
  })
})

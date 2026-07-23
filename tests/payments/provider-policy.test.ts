import { describe, expect, it } from "vitest"

import { selectPaymentProviderMode } from "@/integrations/payments/policy"

describe("payment provider environment policy", () => {
  it("uses the mock provider when no Paystack secret is configured", () => {
    expect(selectPaymentProviderMode(undefined, "development")).toBe("mock")
  })

  it("allows genuine test keys during local development", () => {
    expect(
      selectPaymentProviderMode("sk_test_example", "development"),
    ).toBe("paystack")
  })

  it("blocks live Paystack keys outside production", () => {
    expect(
      selectPaymentProviderMode("sk_live_example", "development"),
    ).toBe("mock")
    expect(selectPaymentProviderMode("sk_live_example", "test")).toBe("mock")
  })

  it("allows test-mode staging and live production credentials", () => {
    expect(selectPaymentProviderMode("sk_test_example", "production")).toBe(
      "paystack",
    )
    expect(selectPaymentProviderMode("sk_live_example", "production")).toBe(
      "paystack",
    )
  })
})

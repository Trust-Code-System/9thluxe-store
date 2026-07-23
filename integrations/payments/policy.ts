export type PaymentProviderMode = "mock" | "paystack"

/**
 * Never let a local/test process contact Paystack with a live secret.
 * Test keys remain usable in production-mode staging builds.
 */
export function selectPaymentProviderMode(
  secretKey: string | undefined,
  nodeEnv: string,
): PaymentProviderMode {
  if (!secretKey) return "mock"
  if (secretKey.startsWith("sk_live_") && nodeEnv !== "production") {
    return "mock"
  }
  return "paystack"
}

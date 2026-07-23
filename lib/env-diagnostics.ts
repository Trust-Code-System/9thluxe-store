const STRICT_CRITICAL_ENV_KEYS = ["DATABASE_URL", "NEXTAUTH_URL"] as const

const PRODUCTION_CRITICAL_ENV_KEYS = [
  "APP_URL",
  "RESEND_API_KEY",
  "NEWSLETTER_FROM_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CRON_SECRET",
] as const

const OPTIONAL_ENV_KEYS = [
  "NEXTAUTH_SECRET",
  "APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",
  "RESEND_API_KEY",
  "ADMIN_EMAILS",
] as const

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0
}

export function getEnvDiagnostics() {
  const missingCritical: string[] = STRICT_CRITICAL_ENV_KEYS.filter(
    (key) => !hasValue(process.env[key])
  )
  if (process.env.NODE_ENV === "production") {
    missingCritical.push(
      ...PRODUCTION_CRITICAL_ENV_KEYS.filter((key) => !hasValue(process.env[key])),
    )
    if (process.env.PAYMENTS_ENABLED === "true") {
      for (const key of ["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY"]) {
        if (!hasValue(process.env[key])) missingCritical.push(key)
      }
    }
  }

  const hasAuthSecret = hasValue(process.env.AUTH_SECRET) || hasValue(process.env.NEXTAUTH_SECRET)
  if (!hasAuthSecret) {
    missingCritical.push("AUTH_SECRET_OR_NEXTAUTH_SECRET")
  }
  const missingOptional = OPTIONAL_ENV_KEYS.filter((key) => !hasValue(process.env[key]))

  return {
    environment: process.env.NODE_ENV || "development",
    missingCritical,
    missingOptional,
  }
}

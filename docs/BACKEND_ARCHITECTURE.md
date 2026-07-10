# Backend Architecture

## Shape
A **modular monolith** on the existing Next.js 16 App Router + Prisma/Postgres stack. No rewrite,
no microservices. New capabilities are added as **provider-abstracted modules** so vendors can be
swapped without touching business logic.

```
app/api/**            HTTP surface (being migrated to /api/v1 with the envelope)
lib/http/**           envelope, error catalogue, safe route handler + requestId
lib/config/**         commerce policy + feature flags (all thresholds here, none hard-coded)
lib/observability/**  structured, secret-safe logger
lib/analytics/**      typed first-party events
lib/recommendations/**pure scoring
integrations/**       provider interfaces + adapters (commerce, payments, ai, notifications, search)
  registry.ts         selects concrete providers from env + feature flags
prisma/**             schema, migrations (+ rollback.sql), fixtures/seed
contracts/**          OpenAPI, error catalogue, events, data dictionary, webhooks
tests/**              vitest unit + contract tests
```

## Key principles
1. **Provider independence.** Business code depends on `CommerceProvider`, `PaymentProvider`,
   `SearchProvider`, `AiServices`, `ChannelAdapter` — never on Shopify/Paystack/OpenAI directly.
   `integrations/registry.ts` is the only place that picks concrete adapters.
2. **Local-first commerce.** The default `localCommerce` adapter keeps the store fully working on
   Postgres. Shopify is opt-in (`SHOPIFY_*` + `shopify_commerce` flag) so the store never depends
   on credentials it doesn't have.
3. **Contract-first.** Every v1 response is `{ data, error, meta, requestId }`. Errors use stable
   codes. Contract tests fail if code and `contracts/` drift.
4. **Safe by construction.** `lib/http/handler.ts` guarantees no stack/secret leaks, enforces body
   size, logs with a requestId. AI output is Zod-validated; payments are verified server-side.
5. **Config over constants.** Shipping thresholds, currency, loyalty tiers live in
   `lib/config/commerce.ts`. Financial reward features are behind flags, default OFF.

## Request lifecycle (v1)
`route(handler)` → new `requestId` → body-size check → handler runs → success envelope, or any
thrown `AppError`/`ZodError`/unknown → normalized safe envelope + structured log.

## What is preserved and why
The existing auth (NextAuth v5), Prisma schema/migrations, Paystack webhook, Resend email, and cart
are healthy and retained. We extended rather than replaced them. See `docs/BACKEND_ASSUMPTIONS.md`.

## Migration path to /api/v1
Existing routes under `app/api/**` continue to work. New/renovated routes adopt `route()` +
envelope. The OpenAPI contract describes the target v1 surface the frontend should consume.

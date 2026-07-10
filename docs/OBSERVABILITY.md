# Observability & Reliability

## Structured logging
`lib/observability/logger.ts` emits single-line JSON (`ts, level, message, …context`) with
automatic redaction of sensitive keys and email masking. Never logs secrets, full payment payloads,
or unnecessary PII. Every request carries a `requestId`; failures log `route`, `code`, `status`, and
internal error detail (server-side only).

## Correlation
`requestId` is generated per request in `lib/http/handler.ts`, returned in the body and the
`x-request-id` header. Provider calls (Shopify) accept a correlation id.

## Health / readiness
`app/api/health` exists. `lib/env.integrationStatus()` + `registry.providerStatus()` expose which
integrations/providers are active (safe for an admin panel): database, auth, paystack, resend,
shopify, ai provider + key presence, whatsapp, sms.

## Jobs / webhooks / retries
- `JobRun` (status, attempts, lastError, timestamps) for background work + failed-job retention.
- `WebhookReceipt` / `IntegrationEvent` for webhook receipt logging and reprocessing.
- Provider adapters implement timeouts, bounded retry with backoff, and (AI) a circuit breaker.
- Dead-letter handling: failed `JobRun` rows are retained for manual reprocessing.

## Metrics to track
Request rate/error rate by code, p95 latency, webhook success/replay counts, payment verify vs
webhook reconciliation gaps, AI schema-failure/fallback/circuit-open counts + token cost, low-stock
counts.

## Cache invalidation
Catalogue reads are DB-live in the local provider (no stale availability). If a cache is added later,
invalidate on `products/update` + `inventory_levels/update` webhooks.

## Backups & recovery
- **DB backup:** rely on the managed Postgres provider's PITR/automated backups (Neon/Supabase).
  Document the retention window with the owner.
- **Migration rollback:** every migration ships a `rollback.sql` (see `docs/ROLLBACK_PLAN.md`).
- **Incident response:** capture `requestId` from the customer error, search structured logs, check
  `providerStatus()` and circuit state, replay via `WebhookReceipt`/`JobRun`.

## Error monitoring boundary
The logger is sink-agnostic; wire it to Sentry/Datadog/Logtail at the platform layer without code
changes to call sites.

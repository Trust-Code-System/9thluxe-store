# Backend Handoff (for the frontend / Codex agent)

The storefront visual layer is yours. This backend gives you a typed, versioned, catalogue-grounded
API. **Do not** reach into Prisma or provider adapters from the frontend — consume the API.

## Consume this
- **Envelope:** every `/api/v1` response is `{ data, error, meta, requestId }`. On error, `data` is
  null and `error` = `{ code, message, fieldErrors? }`. Show `error.message` to users; branch on
  `error.code`.
- **Contracts:** `contracts/storefront-api.openapi.yaml` (paths + schemas),
  `contracts/error-catalogue.md` (codes → meaning), `contracts/events.md` (analytics events),
  `contracts/data-dictionary.md` (public vs private fields), `contracts/webhooks.md`.
- **Types:** generate a client from the OpenAPI file (e.g. `openapi-typescript`) or mirror the
  envelope types from `lib/http/envelope.ts`. Contract tests (`tests/contract`) fail if backend codes
  drift from the docs.

## Rules for the frontend
- Never mark an order paid client-side; rely on order status from the API (server-verified).
- Prices/totals/stock are authoritative from the server — the API rejects mismatches
  (`PRICE_MISMATCH`, `TOTAL_MISMATCH`, `INSUFFICIENT_STOCK`).
- Free-shipping threshold and fees come from the API/config, not a hard-coded value.
- Recommendations/concierge only return real, in-catalogue, available products (or explicitly
  labelled preorder/waitlist).

## Local development
```bash
npm install
cp .env.example .env          # set DATABASE_URL; leave provider keys blank to use mocks
npx prisma migrate deploy     # or: npx prisma migrate dev
npx prisma db seed            # loads perfume fixtures (non-production)
npm run dev
```
Without provider keys: commerce = local Postgres, payments = mock, AI = mock, messaging = off.

## Testing / quality
```bash
npm run test        # vitest unit + contract tests (no DB required)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npx tsx scripts/migrate/validate.ts   # read-only migration validation (no-ops without DB)
```

## Enabling integrations (owner)
Set the relevant `.env` keys (`PAYSTACK_*` test keys, `RESEND_API_KEY`, `SHOPIFY_*`, `AI_PROVIDER`
+ key, `WHATSAPP_*`/`TWILIO_*`) and toggle `FEATURE_FLAGS`. `registry.providerStatus()` and
`lib/env.integrationStatus()` report what is active. Nothing sends real messages or makes live
charges until real keys are supplied and reviewed.

## Where things live
See `docs/BACKEND_ARCHITECTURE.md`. Provider selection: `integrations/registry.ts`. Policy:
`lib/config/`. Errors/envelope: `lib/http/`. AI: `integrations/ai/`. Data model: `docs/DATA_MODEL.md`.

## New endpoints (takeover session)
Customer:
- `POST /api/v1/loyalty/redeem` — redeem points (403 `FEATURE_DISABLED` unless `loyalty_rewards` on).
- `GET  /api/v1/feed/products` — machine-readable product feed for AI-shopping channels
  (403 `FEATURE_DISABLED` unless `agentic_feed` on). Public commerce data only; cursor-paginated.

Admin (all require an ADMIN session; return `FORBIDDEN` otherwise):
- `POST /api/v1/admin/loyalty` — points adjustment `{ userId, delta, reason }`.
- `GET/POST /api/v1/admin/referrals` — list; request reward (→ Approval Centre) or reverse.
- `POST /api/v1/admin/sample-credits` — grant a sample credit.
- `POST /api/v1/admin/products/sync` — catalogue sync/validate (`{ apply?: boolean }`, dry-run default).
- `GET/POST /api/v1/admin/inventory` — inventory-health report; set absolute stock.
- `GET  /api/v1/admin/feature-flags` — effective + persisted flags (read-only).
- `GET  /api/v1/admin/ai-cost` — AI usage/cost + prompt versions (per-process scope).
- `GET  /api/v1/admin/copilot/inventory|margin|insights` — Owner Copilot read-only assistants.
- `POST /api/v1/admin/copilot/marketing` — AI marketing DRAFT (`autoSend:false`, never sends).

## Guarantees preserved this session
- Financial rewards stay OFF behind flags: points redemption (`loyalty_rewards`), referral payout
  (`referral_rewards`), sample-credit redemption (`sample_credits`). Payouts route through the
  Approval Centre (two-step create → decide → execute; never auto-executes).
- Loyalty points reverse automatically on Paystack `refund.processed`/`charge.refunded` (idempotent).
- Notifications: promotional sends require stored consent and respect quiet hours; all sends are
  durably de-duplicated via `NotificationLog`. WhatsApp promo is never sent without consent + creds.
- Margin/insight/inventory assistants never fabricate numbers (`no_cost_price_data` when cost absent)
  and every metric is traceable via a `sources` map.

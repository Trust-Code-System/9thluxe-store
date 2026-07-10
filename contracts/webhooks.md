# Webhooks Contract

All inbound webhooks MUST be:
1. **Signature-verified** before any parsing side-effect.
2. **Idempotent** — the same event delivered twice produces one effect. Backed by a
   `WebhookReceipt` / `IdempotencyKey` record (see `docs/DATA_MODEL.md`).
3. **Replay-protected** — a previously-seen event id is acknowledged (`200`) but not re-applied.
4. **Fast + safe** — respond `200` quickly; heavy work is queued via a `JobRun`.

## Paystack — `POST /api/paystack/webhook`
- Header: `x-paystack-signature` = HMAC-SHA512 of the raw body using `PAYSTACK_SECRET_KEY`.
- On `charge.success`:
  - Verify signature (`WEBHOOK_SIGNATURE_INVALID` / 401 on failure).
  - Look up order by `metadata.orderId`.
  - If order missing or already `PAID` → ack `200` (idempotent, `PAYMENT_ALREADY_PROCESSED` path).
  - In one DB transaction: mark `PAID`, decrement stock, increment coupon usage, update loyalty.
  - Enqueue receipt email + admin notification (best-effort, never blocks the ack).
- Never mark an order paid from a browser success redirect; only from a verified webhook or a
  server-side `verify` call.

## Shopify — `POST /api/v1/webhooks/shopify` *(adapter present; blocked on `SHOPIFY_WEBHOOK_SECRET`)*
- Header: `x-shopify-hmac-sha256` = base64 HMAC-SHA256 of the raw body using the webhook secret.
- Header: `x-shopify-topic` selects the handler; `x-shopify-webhook-id` is the idempotency key.
- Topics consumed: `products/update`, `inventory_levels/update`, `orders/create`,
  `orders/updated`, `fulfillments/create`, `refunds/create`.
- Each topic maps to an internal `IntegrationEvent` + `JobRun`; handlers are idempotent by
  `x-shopify-webhook-id`.

## Outbound (first-party) webhook-like notifications
Order/shipping lifecycle notifications are delivered through the notification adapters
(email/WhatsApp/SMS/in-app), not raw webhooks. See `contracts/events.md` and
`integrations/notifications`.

## Response shape
Webhook endpoints return a minimal ack `{ "ok": true }` with the appropriate status. They do
**not** use the customer envelope (they are provider-to-server, not storefront APIs), but they log
with a `requestId` and never leak internal errors.

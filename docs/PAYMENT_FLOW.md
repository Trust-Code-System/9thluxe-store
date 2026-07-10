# Payment Flow (Paystack)

**Golden rule:** an order is marked PAID **only** by server-side verification or a
signature-verified webhook. A browser returning to the success URL never marks payment.

## Provider abstraction
`integrations/payments/types.ts` defines `PaymentProvider`. The registry picks:
- `paystackProvider` when `PAYSTACK_SECRET_KEY` is set (test/sandbox key in this project).
- `mockPaymentProvider` otherwise (deterministic, offline, used in dev/tests).

## Sequence
1. **Create order (PENDING).** Server recomputes subtotal from DB prices, validates stock, and
   verifies the client total (`TOTAL_MISMATCH` on drift). Reference is unique per order.
2. **Initialize payment.** `provider.initialize()` validates currency (`CURRENCY_INVALID`) and a
   positive integer amount, converts NGN→kobo, returns `authorizationUrl` for redirect.
3. **Customer pays** on Paystack's hosted page.
4. **Webhook `charge.success`** → `verifyWebhook()` checks the `x-paystack-signature` HMAC-SHA512
   with **constant-time comparison**. On success, in one DB transaction: mark PAID, decrement stock,
   increment coupon usage, update loyalty. Idempotent: already-PAID or unknown order → ack `200`.
   Duplicate/replay events are absorbed via `WebhookReceipt` uniqueness.
5. **(Optional) reconcile** with `provider.verify(reference, { amountNGN, currency })`; `amountMatches`
   guards against amount tampering.

## Failure / abandonment
- `failed`/`abandoned` statuses are surfaced via `PaymentStatus`; the order stays PENDING and can be
  recovered (abandoned-checkout notification event).
- Provider errors are normalized to `PROVIDER_ERROR`/`PROVIDER_TIMEOUT`; raw provider payloads are
  never returned to the customer.

## Shopify + Paystack note
No specific Shopify↔Paystack headless flow is assumed. Current paths:
- **Verified production path:** direct Paystack init + webhook against the local order (implemented).
- **Sandbox path:** same, using test keys.
- **Dev fallback:** mock provider.
- **Blocked:** Shopify-native checkout handoff (needs `SHOPIFY_*` + approved import).

## Never
Store raw card data. Log full payment payloads. Trust client-side amounts. Mark paid from a redirect.

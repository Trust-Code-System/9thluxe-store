# Error Catalogue (`/api/v1`)

Source of truth: [`lib/http/errors.ts`](../lib/http/errors.ts). Every error returned by a v1 route
uses one of these stable codes inside the response envelope:

```json
{ "data": null, "error": { "code": "COUPON_EXPIRED", "message": "That promo code has expired.", "fieldErrors": [] }, "meta": {}, "requestId": "…" }
```

Rules:
- `code` is stable and safe to switch on in the frontend.
- `message` is safe to display to a customer. It never contains secrets, stack traces, or raw
  provider output.
- `fieldErrors` (optional) lists `{ field, message }` for form validation.
- HTTP status matches the table below.
- Internal detail is logged server-side with the same `requestId`, never returned.

| Code | HTTP | Meaning |
|------|------|---------|
| `INTERNAL_ERROR` | 500 | Unexpected server error. |
| `VALIDATION_ERROR` | 400 | Request body/query failed schema validation (see `fieldErrors`). |
| `NOT_FOUND` | 404 | Resource not found. |
| `RATE_LIMITED` | 429 | Too many requests. |
| `REQUEST_TOO_LARGE` | 413 | Body exceeded size limit. |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported. |
| `SERVICE_UNAVAILABLE` | 503 | Temporary outage. |
| `UNAUTHENTICATED` | 401 | Sign-in required. |
| `FORBIDDEN` | 403 | Authenticated but not permitted. |
| `REAUTH_REQUIRED` | 401 | Sensitive action needs password re-entry. |
| `CSRF_FAILED` | 403 | CSRF token/Origin check failed. |
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist. |
| `PRODUCT_UNAVAILABLE` | 409 | Product exists but unpublished/not in market. |
| `OUT_OF_STOCK` | 409 | Zero stock. |
| `INSUFFICIENT_STOCK` | 409 | Requested qty exceeds stock. |
| `CART_INVALID` | 400 | Cart cannot be processed. |
| `PRICE_MISMATCH` | 409 | Client price differs from server price. |
| `TOTAL_MISMATCH` | 409 | Client total differs from recomputed total. |
| `CURRENCY_INVALID` | 400 | Unsupported currency. |
| `COUPON_INVALID` | 400 | Unknown/invalid coupon. |
| `COUPON_EXPIRED` | 400 | Coupon outside active window. |
| `COUPON_LIMIT_REACHED` | 400 | Coupon usage cap hit. |
| `COUPON_MIN_SUBTOTAL` | 400 | Below coupon minimum subtotal. |
| `PAYMENT_INIT_FAILED` | 502 | Could not initialize payment with provider. |
| `PAYMENT_VERIFICATION_FAILED` | 402 | Server-side payment verification failed. |
| `PAYMENT_ALREADY_PROCESSED` | 409 | Idempotent replay of a completed payment. |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | Webhook signature check failed. |
| `WEBHOOK_REPLAY` | 409 | Webhook event already processed. |
| `REVIEW_NOT_VERIFIED` | 403 | Reviewer has no matching paid order. |
| `REVIEW_DUPLICATE` | 409 | Reviewer already reviewed this product. |
| `AI_UNAVAILABLE` | 503 | AI provider unavailable / circuit open. |
| `AI_OUTPUT_INVALID` | 502 | AI output failed schema validation. |
| `AI_REQUEST_UNSUPPORTED` | 422 | Request outside catalogue-grounded scope. |
| `GUEST_ALLOWANCE_EXHAUSTED` | 401 | Complimentary guest question has been used; sign-in is required. |
| `DAILY_LIMIT_REACHED` | 429 | Authenticated daily concierge allowance reached. |
| `WEB_SEARCH_LIMIT_REACHED` | 429 | Authenticated daily web research allowance reached. |
| `AI_BUDGET_REACHED` | 503 | Configured concierge spend gate reached. |
| `PROVIDER_ERROR` | 502 | Upstream provider error (normalized). |
| `PROVIDER_TIMEOUT` | 504 | Upstream provider timed out. |
| `FEATURE_DISABLED` | 403 | Feature flag off. |

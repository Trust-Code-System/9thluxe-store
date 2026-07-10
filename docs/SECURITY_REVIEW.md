# Security Review

Structured review of the backend attack surface. ✅ addressed in this upgrade · 🟡 partially
addressed / interface provided · ⬜ tracked (see `docs/BACKEND_UPGRADE_TODO.md`).

| Area | Status | Notes |
|------|--------|-------|
| AuthN | ✅ | NextAuth v5 credentials + bcrypt; session strategy JWT. |
| AuthZ (server-side) | 🟡 | `lib/admin.ts` role checks; every protected v1 route must call server-side authz. Owner-only financial data separated in DTOs. |
| IDOR | 🟡 | Customer-owned queries scope by session user; DTO mappers omit private fields. Audit each `[id]` route on v1 migration. |
| SQL injection | ✅ | Prisma parameterized queries only; no string SQL in app code. |
| XSS | ✅ (backend) | APIs return JSON; `x-content-type-options: nosniff`. HTML rendering is frontend-owned. |
| CSRF | 🟡 | Same-site cookies; state-changing v1 routes should verify Origin/`CSRF_FAILED`. Interface in error catalogue. |
| SSRF | ✅ | Outbound calls target fixed provider hosts (Paystack/Shopify/AI); no user-supplied URLs fetched. |
| Mass assignment | ✅ | Zod schemas whitelist fields on every input; server recomputes prices/totals. |
| Webhook forgery | ✅ | Constant-time HMAC verification (Paystack SHA512, Shopify SHA256). |
| Replay attacks | ✅ | `WebhookReceipt` unique `[provider, eventId]`; already-PAID guard. |
| Race / oversell | 🟡 | Stock decrement in a `$transaction` on webhook; checkout revalidates stock. True reservation tracked ⬜. Cached availability never trusted. |
| Payment-state manipulation | ✅ | Paid only via server verify / verified webhook; amount+currency validated; totals recomputed. |
| Coupon abuse | ✅ | DB-validated, usage-capped, min-subtotal enforced, usage incremented atomically. |
| Referral / review abuse | ✅ | Referral rewards flag-gated OFF + Approval-Centre-only payout; no self-referral, one attribution per user, reversible; reviews require matching PAID order; moderation + `reportedCount`. |
| Rate-limit bypass | ✅ | Durable limiter (`lib/middleware/limiter.ts`) — Upstash Redis REST when configured, in-memory fallback; fails open; applied to AI concierge; `enforceRateLimit()` reusable on any mutating route. [Upstash creds blocked → in-memory in this env.] |
| File upload | ⬜ | No untrusted upload path added; when added, enforce type/size. |
| Prompt injection / AI tool abuse | ✅ | Untrusted text redacted + length-bounded; structured-output validation; no tool authority; allowlist-only when tools added. |
| Secret leakage | ✅ | `lib/env.ts` centralizes secrets; logger redacts; no secrets in responses. |
| PII in logs | ✅ | `redact()` masks emails + sensitive keys; bounded recursion; covered by tests. |
| Dependency vulns | 🟡 | `npm audit` advisory; no known criticals introduced by new code. Run in CI. |
| Error normalization | ✅ | No stack/secret/provider payloads returned; stable codes only. |
| Input/output validation | ✅ | Zod on inputs; AI + payment outputs validated; request-size cap. |

## Enforcement guarantees implemented
- Central error normalization (`lib/http/handler.ts`) — impossible to leak a stack via `route()`.
- Constant-time webhook signature comparison.
- Server-side recomputation of prices/totals/stock at order creation.
- Secret-safe structured logging with redaction (tested).

## Highest-priority follow-ups
Provision Upstash (or Redis) creds to activate the durable limiter across serverless instances;
Origin/CSRF checks on all mutating v1 routes; IDOR audit during v1 migration; stock reservation for
high-contention drops; persist AI usage to a table for cross-instance cost accounting.

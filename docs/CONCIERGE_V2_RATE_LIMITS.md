# Concierge V2 entitlements and limits

## Defaults

| Control | Environment key | Default |
| --- | --- | ---: |
| Guest successful questions | `CONCIERGE_GUEST_QUESTIONS` | 1 |
| Authenticated turns per minute | `CONCIERGE_AUTH_PER_MINUTE` | 12 |
| Authenticated successful turns per day | `CONCIERGE_AUTH_DAILY` | 100 |
| Authenticated web searches per day | `CONCIERGE_WEB_DAILY` | 15 |
| Tool calls exposed in one turn | `CONCIERGE_MAX_TOOL_CALLS` | 8 |
| Search calls in one research turn | `CONCIERGE_MAX_SEARCH_CALLS` | 3 |
| Maximum output tokens | `CONCIERGE_MAX_OUTPUT_TOKENS` | 1400 |
| Daily global spend gate | `CONCIERGE_DAILY_SPEND_USD` | 25 |
| Monthly global spend gate | `CONCIERGE_MONTHLY_SPEND_USD` | 300 |

## Guest rule

A random HttpOnly, SameSite=Lax cookie identifies a guest. Only its HMAC digest is stored. Preflight checks whether the allowance is exhausted. The success is claimed inside the same database transaction that saves the completed assistant turn. Provider errors and cancellations do not increment the guest counter. Concurrent successful requests race on an atomic `updateMany` condition; only one can claim the final available success.

## Authenticated rule

The per-minute limit uses the existing limiter keyed by stable user ID. Daily turn and web-search limits use `ConciergeUsageEvent`. Conversation ownership never uses IP. Authenticated production generation requires Upstash; a missing durable backend or a durable-store error fails closed.

## Cost gates

Durable usage rows include token, search, latency, and estimated-cost fields. Default-model estimates use the public prices in `lib/concierge/cost.ts`, verified 2026-07-12. Unknown model overrides deliberately record zero until their current pricing is reviewed and added.

## Runtime requirements

Authenticated per-minute limits require Upstash in production. If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are absent, V2 fails closed for authenticated generation instead of pretending a per-instance memory counter is durable. Guest success allowance remains database-backed and atomic.

Daily and monthly spend gates are global and apply before both guest and authenticated generation. Default-model token and hosted-search estimates come from `lib/concierge/cost.ts`, verified 2026-07-12. Any custom model must receive a reviewed price entry before rollout.

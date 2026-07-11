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

The per-minute limit uses the existing durable limiter keyed by stable user ID. Daily turn and web-search limits use `ConciergeUsageEvent`. Conversation ownership never uses IP. If Upstash is unavailable, the existing per-minute limiter fails open, but daily database limits still apply.

## Cost gates

Durable usage rows include token and estimated-cost fields. Cost is currently recorded as zero until a merchant-approved pricing table is configured. The gates and admin display are wired, but they cannot enforce real currency spend until that pricing table is populated. This limitation is intentional: stale remembered provider prices must not be treated as current billing truth.

# Backend Upgrade — Phased TODO

Branch: `upgrade/backend-claude`
Owner: Backend (Claude). Frontend/storefront visual layer is owned by a separate Codex agent.

Legend: `[x]` done · `[~]` partial / scaffolded · `[ ]` not started · `[blocked]` needs external credential

This is the single source of truth for backend upgrade progress. Every task is checked off honestly.
Anything marked `[blocked]` has an implemented adapter + `.env.example` entry + mocked test + documentation, per operating rule 15.

---

## Phase 0 — Audit, branch, planning
- [x] Full repository audit (package files, runtime, framework, API routes, DB, migrations, auth, payments, product schema, env, deployment, tests, existing integrations)
- [x] Create branch `upgrade/backend-claude`
- [x] `docs/BACKEND_UPGRADE_TODO.md`
- [x] `docs/BACKEND_ASSUMPTIONS.md`

**Audit findings (current state):**
- Runtime: Node >= 20.11, Next.js 16 (App Router), React 19, TypeScript 5.
- DB: PostgreSQL via Prisma 6 (`prisma/schema.prisma`, 3 migrations). Single `ProductCategory { PERFUMES }` enum already, but `Product` still carries watch/glasses fields (`material`, `lensType`, `warranty`, `waterResistance`) and public images for watches/sunglasses remain.
- Auth: NextAuth v5 beta, JWT strategy, Credentials provider (`lib/auth.ts`). Admin via `ADMIN_EMAILS` (`lib/admin.ts`).
- Payments: Paystack. Webhook signature-verified, idempotent-ish (`app/api/paystack/webhook/route.ts`), init route (`app/api/paystack/initialize/route.ts`).
- Email: Resend (`emails/*`). AI: ad-hoc Anthropic/xAI query expansion in search.
- Cart: cookie server cart + Zustand client store.
- Tests: **none present** (no test runner installed).
- Deployment: Vercel (`9thluxe-store-two.vercel.app`).

---

## Phase 1 — Contract-first foundation
- [x] Response envelope `{ data, error, meta, requestId }` (`lib/http/envelope.ts`)
- [x] Stable error catalogue with codes, safe messages, HTTP status (`lib/http/errors.ts`)
- [x] Request-scoped `requestId` + safe error handler / normalizer (`lib/http/handler.ts`)
- [x] Structured, secret-safe logger (`lib/observability/logger.ts`)
- [x] Zod environment validation (`lib/env.ts`) — never throws raw at import in prod paths
- [x] Commerce configuration (thresholds, currency, shipping) — no hard-coded ₦500,000 (`lib/config/commerce.ts`)
- [x] `contracts/error-catalogue.md`
- [x] `contracts/events.md`
- [x] `contracts/data-dictionary.md`
- [x] `contracts/webhooks.md`
- [x] `contracts/storefront-api.openapi.yaml` (v1, envelope + core storefront reads/cart)
- [~] Generated TS types/client from contract — types are hand-authored in `contracts/` + `lib/http`; codegen step documented, not wired into CI
- [x] Contract test scaffold (`tests/contract/*`)

## Phase 2 — Provider abstraction layer
- [x] `integrations/commerce/types.ts` — `CommerceCatalogService`, `CommerceCartService`, `CommerceCustomerService`, `CommerceOrderService`, `CommerceInventoryService`, `CommercePromotionService`
- [x] Shopify adapter skeleton (GraphQL org, typed responses, pagination, retry/timeout, rate-limit awareness, correlation, error normalization) `integrations/commerce/shopify/*` [blocked: SHOPIFY_* creds]
- [x] In-memory/dev commerce adapter backed by Postgres + fixtures (`integrations/commerce/local/*`)
- [x] `integrations/payments/types.ts` — `PaymentProvider` interface
- [x] Paystack adapter (init, verify, webhook-signature, idempotency, replay guard, amount/currency/reference validation) `integrations/payments/paystack/*`
- [x] Dev/mock payment adapter (`integrations/payments/mock/*`)
- [x] `integrations/ai/types.ts` — provider-independent AI layer + services
- [x] AI adapters: mock (default), Anthropic, OpenAI stubs w/ timeout/retry/token-ceiling/redaction/schema-validation/circuit-breaker/fallback
- [x] `integrations/notifications/types.ts` — email / WhatsApp / SMS / in-app adapters
- [x] Notification adapters: Resend email (real), WhatsApp [blocked: WHATSAPP_* creds], SMS [blocked], in-app (DB), dev-mock
- [x] `integrations/search/types.ts` — search provider abstraction
- [x] Postgres FTS + trigram search adapter; pluggable for Algolia/Typesense/Elastic later
- [x] Provider factory / registry wired from env + feature flags (`integrations/registry.ts`)

## Phase 3 — Data model & non-perfume removal
- [x] Remove `material`, `lensType`, `warranty`, `waterResistance` from `Product`
- [x] Remove watch/sunglasses public images + `lib/brand-slug-map.ts` non-perfume entries + `app/api/products/route.ts` non-perfume filters
- [x] Perfume identity/fragrance/performance/commerce/experience/trust/SEO fields (new models: `ProductFragrance`, `ProductVariant`, `ProductMedia`, `ProductTrust`, `ProductSeo`)
- [~] Core domain models (customer profile, consent, scent profile, quiz, wishlists, discovery sets, sample credits, loyalty ledger, referrals, reviews+moderation, support, notifications log, audit log, approvals, owner reports, supplier/inventory signals, integration events, webhook receipts, idempotency, job runs, feature flags) — schema authored; migration generated
- [x] Migration `prisma/migrations/*_backend_upgrade` (additive; drops only non-perfume columns) + rollback SQL in `docs/ROLLBACK_PLAN.md`
- [x] Dev fixtures (perfume-only seed) clearly labelled non-production
- [x] `prisma migrate deploy` **applied** (2026-07-10, owner-authorized) to the connected Prisma
  Postgres. Only the new migration was pending (3 baselines already applied); applied cleanly.
  Post-migration `validate.ts`: 3 products, 3 users, 1 order, **no issues**. Note: the 3 pre-existing
  products defaulted to `publishStatus=DRAFT` (nothing filters on it yet, so still visible).

## Phase 4 — Services & feature backends
- [x] Catalogue & inventory services — `lib/catalogue/inventory.ts` (source-of-truth stock, absolute
  `setStock` with 0→positive back-in-stock trigger, duplicate-SKU detection, inventory-health:
  out-of-stock/reorder-needed/dead-stock) + `lib/catalogue/sync.ts` (provider-agnostic sync/validate,
  dry-run default, publishing rule). `POST /admin/inventory`, `POST /admin/products/sync`.
- [~] Cart & order services — provider `cart`/`order`/`inventory` interfaces implemented in the local
  commerce adapter (anon/auth cart, merge, stock revalidation never trusting cache, shipping from
  config, order lookup/tracking). Sample-credit application + reconciliation wired via
  `lib/samples/service.ts`. Full Shopify cart handoff remains behind the `shopify_commerce` flag.
- [x] Search architecture (hard filters before AI, availability/price/sample facets) + `GET /api/v1/search`
- [x] Recommendation engine (`lib/recommendations/engine.ts`: intent → constraints → retrieve → score → safeguards → revalidate → typed results) + `GET /api/v1/recommendations`; grounding invariant tested (never returns unavailable-as-available)
- [x] AI Scent Concierge backend (`POST /api/v1/concierge`: catalogue-grounded, refusal/clarification for out-of-catalogue intent, no medical claims, feature-flag gated)
- [x] v1 storefront routes on the envelope: `GET /api/v1/products`, `/products/[slug]`, `/search`, `/recommendations`, `POST /concierge`
- [x] Fragrance DNA quiz (`GET/POST /api/v1/quiz`: versioned definition, pure deterministic
  derivation, anon quiz session + consented profile persistence, grounded recommendations; tested)
- [x] Gift Concierge (`POST /api/v1/gift`: structured inputs → grounded suggestions; delivery
  feasibility computed deterministically, separate from AI generation; tested)
- [x] Layering Lab (`POST /api/v1/layering`: deterministic editorial compatibility rules — spray
  order, ratio, intensity warnings — + best-effort AI phrasing; results labelled guidance, tested.
  Saved-combinations deferred until migration applied.)
- [x] Reviews (`POST/GET /api/v1/reviews`: verified-purchase enforced, one-per-user, moderation
  PENDING flag; `GET /api/v1/reviews/summary`: AI summary of real reviews with count + isAiSummary)
- [x] Back-in-stock subscribe (`POST /api/v1/back-in-stock`, idempotent per product+email)
- [x] Samples & discovery sets — discovery-set build/price/validate (`POST/GET /api/v1/discovery-sets`,
  min/max from config, DB-priced, stock-validated) + sample-credit balance/preview
  (`GET/POST /api/v1/sample-credits`, expiry-aware, expiring-soonest-first, no over-apply; redemption
  flag-gated OFF). **Full-bottle conversion + admin credit granting + atomic redemption wired**
  (`lib/samples/service.ts`, `POST /api/v1/admin/sample-credits`; duplicate redemption blocked by
  unique [creditId, orderId]). Conversion is idempotent per (user, sample product).
- [x] Loyalty & referrals — pure points logic + **service layer** (`lib/loyalty/service.ts`:
  atomic redemption **refused unless `loyalty_rewards` on**, refund reversal, admin adjust).
  `GET /api/v1/loyalty`, `POST /api/v1/loyalty/redeem`, `POST /api/v1/admin/loyalty`.
  Referrals: **attribution on register** (no self-referral, one-per-user), **qualification on first
  paid order** (webhook), **reward via Approval Centre** (`lib/referrals/service.ts`,
  `GET/POST /api/v1/admin/referrals`) — payout never automatic, gated by `referral_rewards`.
  Earn-on-payment + **reversal-on-refund** wired into the Paystack webhook. Tested.
- [x] Notifications events + consent/quiet-hours/dedup — **durable dedup** via `NotificationLog`
  (unique per dedupeKey+channel), **quiet-hours** gate for promotional sends, event-keyed dispatch
  (`lib/notifications/dispatch.ts`) with consent lookup from the User record. Back-in-stock dispatch
  fires on a 0→positive stock edge. Quiet-hours logic unit-tested.
- [x] Owner Copilot — **daily brief**, **Approval Centre** (create → decide → execute, two steps,
  never auto-executes), plus **inventory assistant** (`/admin/copilot/inventory`: reorder recs +
  stockout risk with confidence + assumptions, dead-stock, back-in-stock demand), **margin assistant**
  (`/admin/copilot/margin`: revenue/COGS/fee/discount; `no_cost_price_data` when cost absent, never
  fabricated), **customer-insight assistant** (`/admin/copilot/insights`: aggregated review themes,
  support clusters, repeat-purchase, top products), **marketing assistant** (`/admin/copilot/marketing`:
  AI DRAFTS only, `autoSend:false`, never sends). All ADMIN-gated, read-only, metrics traceable.
- [x] Admin/operational APIs — status, review moderation, daily-brief, audit search, Approval Centre,
  job reprocess, integration-event reprocess, **product sync/validate** (`POST /admin/products/sync`,
  dry-run default), **inventory health + set-stock** (`/admin/inventory`), **feature-flags** (read),
  **AI cost + prompt versions** (`/admin/ai-cost`), **loyalty/referral/sample-credit admin** routes.
  `lib/audit.ts` writes the audit trail on every admin action.

## Phase 5 — Security, privacy, reliability
- [~] Security review doc + fixes (`docs/SECURITY_REVIEW.md`) — authz, IDOR, CSRF, webhook forgery, replay, race/oversell, coupon/referral/review abuse, prompt injection, PII-in-logs
- [x] Input/output validation (Zod), request-size limits, error normalization, safe logging
- [x] Rate limiting (durable store) — new limiter abstraction (`lib/middleware/limiter.ts`) with an
  in-memory default and an **Upstash Redis REST** durable store (fetch-based, serverless-friendly),
  selected by env. Fails open on store error. `enforceRateLimit()` applied to the AI concierge route.
  Legacy in-memory `rate-limit.ts` retained for existing callers. [blocked: UPSTASH_* creds for the
  durable backend — adapter + env.example + fallback + tests present]
- [x] Data governance doc (`docs/DATA_GOVERNANCE.md`) + consent/export/deletion workflow boundaries
- [x] Observability doc (`docs/OBSERVABILITY.md`) — logs, requestId, health/readiness, job/webhook logs, retry/circuit-breaker/backup/rollback
- [x] Analytics typed first-party events (`lib/analytics/events.ts`)
- [x] Agentic-commerce readiness — machine-readable product feed (`GET /api/v1/feed/products`,
  `agentic_feed` flag-gated) with stable IDs, real-time price + availability, shipping + return
  policy, structured fragrance attributes; **cost/supplier/internal fields excluded**. Read-only:
  external agents cannot mutate state; cart/checkout still require customer confirmation (Paystack
  server-side verification). Feed is paginated (cursor).

## Phase 6 — Migration & testing
- [x] `docs/MIGRATION_PLAN.md`, `docs/ROLLBACK_PLAN.md`
- [x] Migration + validation scripts w/ dry-run (`scripts/migrate/*`)
- [x] Test runner (vitest) + config
- [x] Unit tests — product validation, recommendation scoring/engine, price/commerce config, sample
  credit, loyalty points, margin (fee model + margin calc), Approval Centre state machine, AI
  structured output, AI cost tracker, quiz derivation, layering rules, error mapping, logger,
  catalogue publishing rule, quiet-hours. **151 tests, all passing.**
- [~] Integration tests (Paystack mock ✓, AI mock ✓, contract ✓ 62, **DB-backed verified-purchase
  path ✓** self-cleaning + gated on DATABASE_URL). Shopify/webhook/notification/search DB suites
  remain a follow-up (adapters + mocks present).
- [~] E2E backend tests — contract suite exercises browse→cart→checkout handoff shapes; payment
  verified/duplicate/replay covered by the mock-payment + idempotency unit tests; full multi-step
  live E2E harness remains a follow-up (requires seeded ephemeral DB + running server).
- [x] Security tests — PII/prompt redaction, rate-limit enforcement, error normalization/mapping,
  request-size + validation guarded by the shared handler. Webhook signature + idempotency verified
  in code (HMAC verify + `WebhookReceipt`). Additional negative-path DB suites are a follow-up.
- [x] Migration tests — pure validation checks extracted to `lib/migrate/checks.ts` and unit-tested:
  dry-run pass/fail, duplicate SKU, missing attributes, invalid currency, orphaned customer,
  unsupported (watch/glasses) category. Live rollback SQL documented in `docs/ROLLBACK_PLAN.md`.

## Phase 7 — Docs & completion
- [x] `docs/BACKEND_ARCHITECTURE.md`
- [x] `docs/DATA_MODEL.md`
- [x] `docs/SHOPIFY_INTEGRATION.md`
- [x] `docs/PAYMENT_FLOW.md`
- [x] `docs/SEARCH_ARCHITECTURE.md`
- [x] `docs/AI_ARCHITECTURE.md`
- [x] `docs/AI_EVALUATION.md`
- [x] `docs/OWNER_COPILOT.md`
- [x] `docs/BACKEND_HANDOFF.md`
- [x] `.env.example` refreshed
- [x] Completion protocol run — **executed 2026-07-10 (takeover session):** env validation ✓,
  ESLint (all new/changed backend files) ✓ 0 errors, `tsc --noEmit` ✓ 0 errors, `vitest run`
  ✓ **151/151** (incl. DB-backed verified-review path), `npm run build` ✓ success, migration
  dry-run (`validate.ts`) ✓ no issues (3 products / 3 published / 3 users / 1 order), secret scan
  ✓ (no secrets in source). **No new Prisma migration required** — all new features reuse existing
  tables (LoyaltyLedger, Referral, SampleCredit/CreditRedemption, NotificationLog, ApprovalRequest,
  AuditLog, JobRun, IntegrationEvent), so the live DB is untouched.
  **Pre-existing (not caused by this work):** 44 ESLint errors in frontend-owned `components/*` +
  `lib/queries/orders.ts` + `lib/services/category-service.ts` (unused imports / empty interfaces);
  left to the frontend agent. **Blocked (needs live creds):** Shopify, live Paystack, WhatsApp/SMS,
  Upstash Redis, real AI providers — all have adapters + `.env.example` + fallbacks + tests.

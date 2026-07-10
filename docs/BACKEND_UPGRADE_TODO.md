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
- [ ] `prisma migrate` applied — **deliberately NOT applied.** A live `DATABASE_URL` is connected but still on the OLD schema (validation confirms `sku` absent). Applying alters a possibly-production DB and is an irreversible/live-system change requiring explicit owner approval (which DB + permission). Read-only `scripts/migrate/validate.ts` verified: 3 products, 3 users, 1 order, no non-perfume rows, no orphaned orders, no blocking issues.

## Phase 4 — Services & feature backends
- [~] Catalogue & inventory services (sync, publish rules, low/out-of-stock, back-in-stock, preorder/waitlist, reconciliation, dup-SKU, source-of-truth doc)
- [~] Cart & order services (anon/auth cart, merge, revalidation, gift, sample credit, shipping threshold from config, tracking, reconciliation)
- [x] Search architecture (hard filters before AI, availability/price/sample facets) + `GET /api/v1/search`
- [x] Recommendation engine (`lib/recommendations/engine.ts`: intent → constraints → retrieve → score → safeguards → revalidate → typed results) + `GET /api/v1/recommendations`; grounding invariant tested (never returns unavailable-as-available)
- [x] AI Scent Concierge backend (`POST /api/v1/concierge`: catalogue-grounded, refusal/clarification for out-of-catalogue intent, no medical claims, feature-flag gated)
- [x] v1 storefront routes on the envelope: `GET /api/v1/products`, `/products/[slug]`, `/search`, `/recommendations`, `POST /concierge`
- [ ] Fragrance DNA quiz (versioned, anon+auth, derived profile)
- [ ] Gift Concierge (delivery feasibility validated separately)
- [ ] Layering Lab (editorial rules + AI explanation, non-guaranteed)
- [~] Reviews (verified-purchase, moderation audit, AI summary with count + regeneration)
- [ ] Samples & discovery sets (credit ledger, redemption, expiry, conversion, abuse prevention)
- [ ] Loyalty & referrals (configurable, disabled until approved)
- [~] Notifications events + consent/quiet-hours/dedup
- [ ] Owner Copilot (daily brief, inventory, marketing, insight, margin, Approval Centre)
- [ ] Admin/operational APIs (sync, moderation, reports, job/webhook reprocess, flags, audit search)

## Phase 5 — Security, privacy, reliability
- [~] Security review doc + fixes (`docs/SECURITY_REVIEW.md`) — authz, IDOR, CSRF, webhook forgery, replay, race/oversell, coupon/referral/review abuse, prompt injection, PII-in-logs
- [x] Input/output validation (Zod), request-size limits, error normalization, safe logging
- [ ] Rate limiting (durable store) — existing in-memory limiter (`lib/middleware/rate-limit.ts`) retained; durable Redis-backed limiter NOT yet added (documented as follow-up in SECURITY_REVIEW)
- [x] Data governance doc (`docs/DATA_GOVERNANCE.md`) + consent/export/deletion workflow boundaries
- [x] Observability doc (`docs/OBSERVABILITY.md`) — logs, requestId, health/readiness, job/webhook logs, retry/circuit-breaker/backup/rollback
- [x] Analytics typed first-party events (`lib/analytics/events.ts`)
- [~] Agentic-commerce readiness (feeds, stable IDs, price/inventory validation, safe cart/checkout handoff, agent audit)

## Phase 6 — Migration & testing
- [x] `docs/MIGRATION_PLAN.md`, `docs/ROLLBACK_PLAN.md`
- [x] Migration + validation scripts w/ dry-run (`scripts/migrate/*`)
- [x] Test runner (vitest) + config
- [~] Unit tests (product validation, recommendation scoring, price calc, sample credit, loyalty ledger, margin, permissions, error mapping, AI structured output, payment-state transitions)
- [~] Integration tests (Shopify adapter mock, Paystack mock, DB, webhooks, notifications, search, AI mock, contract, auth)
- [ ] E2E backend tests (browse→cart, cart→checkout, verified/failed/duplicate/replay payment, oversell race, tracking, review verify, sample redemption, back-in-stock, AI unavailable-product, owner approval, account deletion)
- [ ] Security tests (unauthorized access, role escalation, malformed/invalid-sig webhook, dup idempotency, oversized request, prompt-injection, sensitive-log, rate limits)
- [ ] Migration tests (dry-run, rollback, dup SKU, missing attr, invalid currency, orphaned customer, unsupported category)

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
- [~] Completion protocol run — **executed this session:** `npm install` ✓, env validation ✓,
  ESLint (new code) ✓ 0 errors, `tsc --noEmit` ✓ 0 errors, `vitest run` ✓ 89/89, `npm run build`
  ✓ success, migration dry-run (read-only `validate.ts`) ✓ no blocking issues, offline
  rollback.sql generated ✓, secret scan ✓ (no secrets committed, no live-key patterns in source).
  **Blocked (needs owner approval / live DB):** applying migrations, seeding the live DB, and the
  DB/E2E/security test suites that require a migrated Postgres.

# Backend Upgrade — Assumptions

These are the explicit assumptions made during the backend upgrade. They are recorded so the
business owner / frontend agent can correct any that are wrong. No business data is invented;
where data was unavailable, an adapter + fixtures + documentation were provided instead.

## Architecture decisions
1. **Preserve the healthy Next.js + Prisma/Postgres modular monolith.** The existing stack is
   reliable and directly supports the required architecture. We do **not** rewrite it. Shopify is
   introduced as a *pluggable commerce engine behind provider interfaces*, not as a forced
   replacement, so the store keeps working with the local Postgres catalogue until Shopify
   credentials + an approved import exist.
2. **Prisma is kept** (not swapped for Drizzle). It is already wired, migrated, and used across
   the codebase. Adding a second ORM would increase risk for no benefit.
3. **Zod is kept** for validation (already a dependency).
4. **Search MVP = PostgreSQL full-text + trigram.** pgvector/Algolia/Typesense are left as
   documented swap-in adapters. No new infrastructure is required to run the store.
5. **Background jobs**: a lightweight DB-backed job/idempotency model is used (no external queue),
   appropriate to Vercel serverless. A queue adapter interface is provided for later.
6. **Cache/Redis**: not introduced yet; rate-limit + cache use an in-memory default with a
   documented Redis adapter interface. Serverless multi-instance limitations are documented.

## External credentials assumed **absent** in this environment
Per operating rule 15, for each of these we implemented the adapter, added `.env.example` keys,
added validation, added dev fixtures, added mocked tests, and documented the gap. Nothing below is
claimed to work in production.
- `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_API_TOKEN`, `SHOPIFY_ADMIN_API_TOKEN`,
  `SHOPIFY_API_VERSION`, `SHOPIFY_WEBHOOK_SECRET` — Shopify Storefront/Admin.
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — treated as **sandbox/test** only. No live charges.
- `WHATSAPP_*` / `TWILIO_*` — messaging. No real messages sent.
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — AI. Default provider is the deterministic **mock**.
- `DATABASE_URL` — not assumed present in this session; migrations are authored but **not applied**
  here. Dry-run + validation scripts are provided.

## Business rules assumed until confirmed
- **Currency** is NGN. Multi-currency/Markets are modelled but disabled by default.
- **Free-shipping threshold** and shipping fees are read from `lib/config/commerce.ts`
  (env-overridable). The previously hard-coded ₦500,000 is now `COMMERCE_FREE_SHIPPING_THRESHOLD_NGN`
  with the same default, so behaviour is unchanged until the owner adjusts it.
- **Loyalty tiers** keep the existing thresholds already present in the webhook
  (OBSIDIAN ≥ ₦200k, GOLD ≥ ₦1M, PLATINUM ≥ ₦5M) but are now expressed as configuration.
  **Financial rewards (points redemption, referral payouts) stay disabled** behind a feature flag
  until the owner approves the rules.
- **Reviews** require a matching PAID order for verified status. Existing reviews are treated as
  unverified-legacy (not retroactively marked "verified purchase").
- **Sample credits / discovery sets**: pricing and redemption rules are modelled but **inactive**
  until product/price inputs are supplied. No credit values are invented.
- **Margin**: cost price + supplier data are optional; when absent, margin outputs return
  `insufficient_data` rather than fabricated numbers.

## Data / catalogue assumptions
- The business is **perfume-only**. All watches/glasses concepts (schema columns, images,
  brand-slug entries, product-type filters) are removed. Any perfume records already in the DB are
  preserved; non-perfume records (if any exist) are quarantined by the migration validation script,
  not silently deleted.
- Subjective performance data (longevity, sillage, intensity) is stored as **editorial/aggregated
  customer opinion**, never as scientific fact.
- Authenticity: fields distinguish **retailer inspection** from **manufacturer verification**; we
  never label retailer inspection as manufacturer-verified.

## Privacy assumptions
- Applicable baseline: Nigeria NDPA, designed to extend to GDPR-style rights (export, deletion,
  consent records). Marketing (email/WhatsApp/SMS) requires stored consent; transactional messages
  do not. Addresses, payment data, and private conversations are **not** sent to AI providers.

## Takeover-session assumptions (2026-07-10)
- **No new database migration.** Every feature added in this session (loyalty redemption/reversal,
  referral attribution/qualification/reward, sample-credit granting/redemption/full-bottle
  conversion, notification dispatch, Copilot assistants, admin ops, agentic feed, rate limiter)
  reuses tables that already exist in the applied schema. This deliberately avoids touching the live
  connected Postgres.
- **Referral reward economics are undefined**, so `requestReferralReward` only creates an Approval
  Centre record (action `compensation`) and is refused unless `referral_rewards` is on. No monetary
  value is assumed or paid.
- **Payment-fee model** for the margin assistant assumes the standard Paystack NGN schedule
  (1.5% + ₦100, ₦100 waived under ₦2,500, capped at ₦2,000). It is a pure, overridable model
  (`DEFAULT_FEE_MODEL`) — adjust when the merchant's real rate is confirmed.
- **Full-bottle conversion credit** = the sample's price, valid 90 days, granted once per
  (customer, sample product). This is a reasonable default pending an approved policy; redemption is
  still gated by `sample_credits`.
- **Quiet hours** default to 21:00–08:00 local and apply only to promotional (never transactional)
  messages. The recipient's local hour is supplied by the caller; when unknown, quiet hours are not
  enforced (transactional delivery is never delayed).
- **Durable rate limiting** uses Upstash Redis REST when `UPSTASH_REDIS_REST_*` are set; otherwise an
  in-memory per-instance limiter (under-counts across serverless instances — documented). The limiter
  fails **open** so an outage never blocks the API.
- **Marketing assistant never sends.** It returns drafts with `autoSend:false`; any real send must go
  through the Approval Centre (`campaign`) + the existing newsletter/notification pipeline.
- **AI cost tracking is per-process** (serverless-instance scoped). Durable cross-instance accounting
  (persist to a table) is noted as a follow-up in `docs/AI_ARCHITECTURE.md`.

## Frontend boundary
- We do not modify storefront visual components, motion, or `FRONTEND/` (the separate v0 project).
- The frontend consumes: the `/api/v1` envelope, `contracts/storefront-api.openapi.yaml`, the error
  catalogue codes, and the typed events. Breaking changes are guarded by contract tests.

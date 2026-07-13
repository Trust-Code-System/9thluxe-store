# Concierge V2 handoff

Status date: 2026-07-12

## What changed

- Added an additive Prisma migration named `20260711230000_concierge_v2` for owned conversations/messages, guest allowance, durable usage, feedback, and approved perfume knowledge.
- Added typed intent, entities, conversation state, evidence, product, source, and stream contracts under `lib/concierge`.
- Added a multi-turn orchestrator that separates safety, knowledge, catalogue, and current research paths.
- Added typed catalogue, variant, review, approved Scent Atlas, knowledge, layering, profile, wishlist, and past-recommendation tools.
- Added provider capabilities, task routing, bounded fallback, xAI support, hosted research, production mock prohibition, per-capability circuit state, and real upstream text streaming.
- Added V2 streaming, history with revalidated product hydration, allowance, conversation ownership, archive/rename, and feedback endpoints.
- Rebuilt the concierge client as a full-height responsive conversation workspace with history, streamed status/text, cancellation, retry, product context, sources, feedback, and guest sign-in gate.
- Added an admin Concierge V2 status page and sidebar entry.
- Added router/policy/context/regression evaluation tests and browser cases.

## Migration and deployment

The migration was applied successfully to the configured database on 2026-07-13. For any additional environment, deploy it with:

```text
npx prisma migrate deploy
npx prisma generate
```

Back up the target database first and use a preview/staging database. V1 remains at `/api/v1/concierge`. Disable V2 with `!concierge_v2` in `FEATURE_FLAGS`; disable all AI concierge access with `!ai_concierge`.

## Provider documentation date

OpenAI, Anthropic, Google Gemini, and xAI official API documentation was verified on 2026-07-12. Links and capability notes are in `CONCIERGE_V2_PROVIDER_MATRIX.md`.

## Environment additions

`AI_PROVIDER_PRIORITY`, `AI_DEMO_MODE`, all `CONCIERGE_*` limit/budget keys, and `CONCIERGE_CATALOGUE_ONLY` were added to `.env.example`. xAI is now accepted by `AI_PROVIDER` and has both a V2 Responses-compatible path and a legacy structured-task adapter.

## Known limitations

- The configured database is migrated. Authenticated continuation and concurrent multi-session testing still need a deployed preview with real auth.
- Cost estimates cover the configured default models using public prices verified on 2026-07-12. Any unknown model override records zero until its current price is reviewed and added to `lib/concierge/cost.ts`.
- Current web-research answers are buffered until supporting sources pass URL validation. Normal knowledge and catalogue-assisted answers stream directly from the upstream provider.
- Gemini uses the supported `generateContent` path, not the newer Interactions API.
- The approved knowledge table has no seeded merchant-approved entries yet. General answers use the selected model unless deterministic policy or approved product evidence applies.
- The current live catalogue migration notes say existing products defaulted to `DRAFT`. V2 correctly excludes them until the merchant publishes them, so preview catalogue cards may be empty.
- The attached request did not include the referenced screenshot. Fresh local desktop/mobile V1 evidence was captured instead.
- The gstack browser daemon failed to start on Windows. Installed Playwright remained available and was used for baseline screenshots.
- The admin page is a status and observability dashboard. Runtime configuration editing still requires environment changes and redeployment.
- Preview deployment, real-provider research citations, authenticated continuation, concurrent guest claims, and broader owner testing remain recommended follow-up verification.

## Validation executed

- `npm run typecheck`: passed.
- `npm run lint`: passed, including the customer-facing em dash guard.
- `npm test`: 297 tests passed across 38 files, including DB-backed verified-review integration tests.
- `npm run build`: passed; all V2 and admin routes compiled.
- `npx playwright test tests/e2e/concierge-v2.spec.ts`: 13 passed and 3 intentionally skipped cross-project axe duplicates across desktop Chromium, tablet Chromium, mobile Chromium, and mobile WebKit. Coverage includes 320px overflow, dark/light rendering, and the dedicated desktop axe pass.
- Dedicated concierge axe pass: no automatic critical or serious violation.
- `npx prisma migrate deploy`: migration `20260711230000_concierge_v2` applied successfully on 2026-07-13.
- `npx prisma migrate status`: database schema is up to date after deployment.

## Rollback

1. Set `FEATURE_FLAGS` to include `!concierge_v2` and redeploy. The storefront returns to the existing V1 endpoint without dropping data.
2. Keep the additive tables in place during rollback. They do not alter commerce, payments, auth, inventory, orders, or existing product fields.
3. Only remove V2 tables in a separately reviewed migration after retained conversation/usage data is no longer required.

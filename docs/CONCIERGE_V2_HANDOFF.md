# Concierge V2 handoff

Status date: 2026-07-11

## What changed

- Added an additive Prisma migration named `20260711230000_concierge_v2` for owned conversations/messages, guest allowance, durable usage, feedback, and approved perfume knowledge.
- Added typed intent, entities, conversation state, evidence, product, source, and stream contracts under `lib/concierge`.
- Added a multi-turn orchestrator that separates safety, knowledge, catalogue, and current research paths.
- Added typed catalogue, variant, review, approved Scent Atlas, knowledge, layering, profile, wishlist, and past-recommendation tools.
- Added provider capabilities, task routing, bounded fallback, xAI support, hosted research, production mock prohibition, and per-capability circuit state.
- Added V2 streaming, history, allowance, conversation ownership, archive/rename, and feedback endpoints.
- Rebuilt the concierge client as a full-height responsive conversation workspace with history, streamed status/text, cancellation, retry, product context, sources, feedback, and guest sign-in gate.
- Added an admin Concierge V2 status page and sidebar entry.
- Added router/policy/context/regression evaluation tests and browser cases.

## Migration and deployment

The migration file was generated but not applied to any database. Before enabling a preview:

```text
npx prisma migrate deploy
npx prisma generate
```

Back up the target database first and use a preview/staging database. V1 remains at `/api/v1/concierge`. Disable V2 with `!concierge_v2` in `FEATURE_FLAGS`; disable all AI concierge access with `!ai_concierge`.

## Provider documentation date

OpenAI, Anthropic, Google Gemini, and xAI official API documentation was verified on 2026-07-11. Links and capability notes are in `CONCIERGE_V2_PROVIDER_MATRIX.md`.

## Environment additions

`AI_PROVIDER_PRIORITY`, `AI_DEMO_MODE`, all `CONCIERGE_*` limit/budget keys, and `CONCIERGE_CATALOGUE_ONLY` were added to `.env.example`. xAI is now accepted by `AI_PROVIDER` and has both a V2 Responses-compatible path and a legacy structured-task adapter.

## Known limitations

- No migration was applied, so live conversation/history/allowance testing against the configured database is pending.
- Estimated cost is stored as zero until the owner approves a current provider pricing table. Token, call, model, and latency tracking works independently.
- Provider streams are normalized into immediate status events followed by chunked text after the provider returns. True token-forwarding from every upstream provider remains follow-up work.
- Gemini uses the supported `generateContent` path, not the newer Interactions API.
- The approved knowledge table has no seeded merchant-approved entries yet. General answers use the selected model unless deterministic policy or approved product evidence applies.
- The current live catalogue migration notes say existing products defaulted to `DRAFT`. V2 correctly excludes them until the merchant publishes them, so preview catalogue cards may be empty.
- The attached request did not include the referenced screenshot. Fresh local desktop/mobile V1 evidence was captured instead.
- The gstack browser daemon failed to start on Windows. Installed Playwright remained available and was used for baseline screenshots.
- Preview deployment, real-provider research citations, authenticated continuation, concurrent guest claims, Playwright, axe, and owner testing remain required before merge.

## Validation executed

- `npm run typecheck`: passed.
- `npm run lint`: passed, including the customer-facing em dash guard.
- `npm test`: 280 tests passed across 31 files, including DB-backed verified-review integration tests.
- `npm run build`: passed; all V2 and admin routes compiled.
- `npx playwright test tests/e2e/concierge-v2.spec.ts`: 8 responsive cases passed across desktop Chromium, tablet Chromium, mobile Chromium, and mobile WebKit.
- Dedicated concierge axe pass: no automatic critical or serious violation.
- `npx prisma migrate status`: migration `20260711230000_concierge_v2` is pending and was not applied.

## Rollback

1. Set `FEATURE_FLAGS` to include `!concierge_v2` and redeploy. The storefront returns to the existing V1 endpoint without dropping data.
2. Keep the additive tables in place during rollback. They do not alter commerce, payments, auth, inventory, orders, or existing product fields.
3. Only remove V2 tables in a separately reviewed migration after retained conversation/usage data is no longer required.

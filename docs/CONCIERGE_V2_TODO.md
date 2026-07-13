# Concierge V2 live checklist

Legend: `[x]` validated, `[~]` implemented but not fully validated, `[ ]` not complete, `[blocked]` requires external state.

## Audit and design

- [x] Inspect repository, branch/status/history/PRs/branches/handoffs
- [x] Trace V1 API, UI, engine, AI, search, limiter, auth, schema, flags, usage, admin status, deployment, and tests
- [x] Reproduce repeated-answer failure with two different questions
- [x] Capture desktop and mobile baseline screenshots
- [x] Verify current official provider documentation dated 2026-07-12
- [x] Write root-cause audit and architecture

## Backend

- [x] Additive Prisma migration for conversations, messages, knowledge, usage, guest entitlement, and feedback
- [x] Typed intent/state/evidence/response contracts
- [x] Deterministic safety and scope layer
- [x] Multi-turn router and state reducer
- [x] Typed catalogue/review/profile/wishlist/knowledge/research tools
- [x] Publication, price, variant, and stock revalidation
- [x] Provider capability registry and task router
- [x] OpenAI, Anthropic, Gemini, and xAI adapters
- [x] Production mock prohibition, fallback, circuit breakers, timeouts
- [~] Web research with validated citations; implemented, real-provider preview validation pending
- [x] Orchestrator and bounded context
- [~] Guest one-success entitlement and sign-in gate; migration applied, concurrent preview integration test pending
- [~] Authenticated minute/day/search limits; migration applied, authenticated preview integration test pending
- [x] Durable usage, default-model cost, first-token/total latency records, and spend gates
- [x] Real upstream text streaming for normal model answers, cancellation, and safe no-fallback-after-partial-output policy
- [x] Conversation/history/feedback/allowance APIs with ownership checks
- [~] Admin status dashboard, provider health, spend, latency, error/cache rates, intents, feedback, and limits; runtime editing still requires environment changes and redeploy

## Frontend

- [x] Full-height responsive shell and history rail
- [x] Broad perfume-intelligence empty state
- [~] Auto-growing composer, keyboard behavior, cancel, retry; edit/regenerate remains follow-up
- [~] Typed response blocks, safe inline citation markers, links, and source cards; comparison tables and note-pyramid blocks remain follow-up
- [x] Revalidated product cards only when relevant
- [x] Guest allowance and sign-in gate
- [~] Copy/helpful actions; report reason UI remains follow-up
- [~] Desktop/tablet/mobile and 320px verified; full screen-reader and light-theme manual sweep pending

## Validation

- [x] Intent/router unit tests
- [x] Tool and catalogue evidence-policy tests
- [x] Provider fallback, xAI, and production mock-prohibition tests
- [~] Conversation ownership and atomic guest-claim tests; configured database migrated, multi-session preview integration remains pending
- [~] Real upstream streaming and no-fallback-after-partial tests; disconnected preview cancellation remains pending
- [~] Citation URL, marker, XSS, and prompt-policy tests; hostile live search page remains pending
- [x] Evaluation suite and repeated-generic-opening regression
- [x] Typecheck
- [x] Lint and em-dash check
- [x] Unit/integration tests: 297 passed across 38 files
- [x] Production build
- [x] Playwright and axe: 13 passed, 3 intentional cross-project axe skips across desktop, tablet, mobile Chromium, and mobile WebKit, including 320px and dark/light checks
- [blocked] Preview deployment and owner conversation testing

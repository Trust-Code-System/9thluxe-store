# Concierge V2 live checklist

Legend: `[x]` validated, `[~]` implemented but not fully validated, `[ ]` not complete, `[blocked]` requires external state.

## Audit and design

- [x] Inspect repository, branch/status/history/PRs/branches/handoffs
- [x] Trace V1 API, UI, engine, AI, search, limiter, auth, schema, flags, usage, admin status, deployment, and tests
- [x] Reproduce repeated-answer failure with two different questions
- [x] Capture desktop and mobile baseline screenshots
- [x] Verify current official provider documentation dated 2026-07-11
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
- [~] Guest one-success entitlement and sign-in gate; atomic implementation present, migration/integration test pending
- [~] Authenticated minute/day/search limits; implementation present, migration/integration test pending
- [~] Durable usage/cost/latency records and spend gates; pricing table needed for non-zero cost
- [~] Streaming/cancellation; status and app-level text events work, upstream token forwarding pending
- [x] Conversation/history/feedback/allowance APIs with ownership checks
- [x] Admin status and controls

## Frontend

- [x] Full-height responsive shell and history rail
- [x] Broad perfume-intelligence empty state
- [~] Auto-growing composer, keyboard behavior, cancel, retry; edit/regenerate remains follow-up
- [~] Typed response blocks, safe links, citations, sources; comparison tables and note-pyramid blocks remain follow-up
- [x] Revalidated product cards only when relevant
- [x] Guest allowance and sign-in gate
- [~] Copy/helpful actions; report reason UI remains follow-up
- [~] Desktop/tablet/mobile and 320px verified; full screen-reader and light-theme manual sweep pending

## Validation

- [x] Intent/router unit tests
- [~] Tool and evidence-policy tests
- [ ] Provider/fallback/xAI/mock-production tests
- [ ] Conversation ownership and entitlement tests
- [ ] Streaming/cancellation tests
- [~] Citation/XSS/prompt-injection tests
- [x] Evaluation suite and repeated-generic-opening regression
- [x] Typecheck
- [x] Lint and em-dash check
- [x] Unit/integration tests: 280 passed
- [x] Production build
- [x] Playwright and axe: 8 responsive cases plus dedicated serious/critical axe pass
- [blocked] Preview deployment and owner conversation testing

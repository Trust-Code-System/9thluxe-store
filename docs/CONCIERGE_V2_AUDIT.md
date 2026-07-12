# Concierge V2 verified audit

Audit date: 2026-07-11  
Branch: `main` at `6365199`  
Runtime inspected: Next.js 16.0.7, React 19.2, Prisma 6.19, NextAuth 5 beta

## Repository state

- The worktree was already dirty before this work. Existing hero changes in `components/home/hero/*`, `lib/hero/orbit-config.ts`, two hero documents, and `scripts/tmp-add-expansion-products.ts` are user-owned and must be preserved.
- The only open pull request is draft PR 4, `Install Vercel Web Analytics`.
- Unmerged branches include `upgrade/backend-claude`, `upgrade/frontend-atelier`, `upgrade/frontend-sol`, `upgrade/pdp-discovery-sol`, `continuation/codex-ui`, and `agent/mobile-verification-harness`. The last two were already merged into `main`; remote feature branches remain.
- Existing handoffs and TODOs were read, especially `BACKEND_HANDOFF.md`, `BACKEND_UPGRADE_TODO.md`, `CONTINUATION_HANDOFF_2026-07-11.md`, `SCENT_INTELLIGENCE.md`, and the PDP/hero handoffs.
- The attachment directory contains only the 46,507-byte text brief. No concierge screenshot was attached. Fresh desktop and mobile screenshots were captured from the local app instead.

## Reproduction

The local app was run on `http://localhost:3000`. Two requests were sent to `POST /api/v1/concierge`:

1. `What is an accord?`
2. `What happens when grape and wood are combined?`

Both returned the exact customer message `Here are catalogue matches for your request.`, the exact mock explanation `These fragrances match your requested notes and stay within your stated preferences.`, and three product cards. This deterministically reproduces the reported defect.

## Confirmed root causes

1. `app/api/v1/concierge/route.ts` unconditionally calls `recommend()` for every accepted message. There is no knowledge-answering, research, support, comparison, or safety route before catalogue retrieval.
2. `lib/recommendations/engine.ts` is correctly designed as a commerce recommender, not a perfume assistant. Thin retrieval deliberately falls back to a filtered catalogue listing, so weak or absent intent extraction still produces products.
3. The endpoint overwrites every successful answer with one fixed sentence. It does not use the generated `result.explanation` as the answer.
4. `components/concierge/concierge-client.tsx` never renders the returned `explanation` field. Only `data.message`, product items, and the disclaimer are used.
5. The AI intent contract has only eight shopping-oriented intents. It cannot represent perfume knowledge, notes, ingredients, climate education, history, current research, price, availability, medical sensitivity, or out-of-scope distinctions.
6. The model is used only for structured shopping intent, short recommendation explanation, support, review summary, marketing drafts, and owner briefs. There is no long-form fragrance answer generator.
7. Conversation turns exist only in local React state. The request contains no conversation ID, prior messages, summary, constraints, or referenced products.
8. There are no concierge conversation/message tables, ownership checks, archive/search APIs, or durable citations.
9. `AI_PROVIDER` selects exactly one provider. The provider interface has no capability metadata, task routing, or provider fallback chain.
10. xAI keys and model configuration exist in `.env` and `.env.example`, but xAI is absent from the validated `AI_PROVIDER` enum, provider type, registry, and adapters.
11. Missing keys and provider failures silently fall back to deterministic mock output, including production. The customer is not told that the answer is synthetic.
12. Circuit breaking is keyed only by provider name, not capability. The retry chain repeats the same provider twice and then uses mock rather than a second configured provider.
13. The OpenAI adapter uses Chat Completions even though current official guidance recommends Responses for multi-turn reasoning, tools, streaming, and hosted web search.
14. No provider supports streamed text in the application contract. The frontend shows bouncing dots until a complete JSON response arrives and cannot cancel a request.
15. There is no web research interface, domain policy, source validation, citation model, citation rendering, or search allowance.
16. The existing search provider is Postgres substring search. Its `accord`, `mood`, `climate`, `concentration`, and `sampleAvailable` filter fields are declared but not implemented.
17. Catalogue reads exclude deleted records but do not require `publishStatus=PUBLISHED`. Existing migration notes state that pre-existing products defaulted to `DRAFT`, yet they remain public.
18. Stock filtering happens during initial recommendation retrieval for most requests. This prevents useful off-catalogue or out-of-stock knowledge from being discussed.
19. Product loading revalidates existence and stock once, but public commerce DTO reads do not consistently enforce publication status. Variant stock is not selected for the returned availability label.
20. The rate limit is one IP-scoped `20/minute` counter. It does not distinguish guests, authenticated users, daily usage, successful completions, or web searches.
21. Durable rate limiting uses Upstash when configured, but fails open on store errors. There is no exactly-once guest entitlement or atomic post-success consumption.
22. AI usage aggregation is in-process only. It records calls and tokens but no durable spend, request/conversation IDs, first-token latency, tool calls, completion status, cache status, or feedback.
23. The admin status endpoint shows only the selected AI provider. It does not expose all configured providers, capabilities, health, circuit state, limits, spend, or concierge metrics.
24. Scent intelligence is stored primarily on `Product` and in a code-owned ingredient library. Ingredient entries have approval metadata and public normalization rejects unapproved entries. Scent Story generation creates a reviewable rule-based draft and does not write or publish automatically.
25. There is no dedicated approved perfume knowledge table. There is no separate Scent Atlas approval object, source URL record, verifier, or merchant-approved educational content workflow.
26. Review APIs and models exist, including verified purchase and moderation fields, but the concierge has no review retrieval tool and does not separate Fádé reviews from external review research.
27. Wishlist and Scent Profile data exist, but there are no concierge tools for wishlist, profile, or past recommendations.
28. The page is constrained to `max-w-2xl`. Desktop has large unused side areas, no history rail, and no optional context panel. Mobile is usable but remains a narrow recommendation form with no history, sources, cancellation, feedback, or saved conversations.
29. The empty state explicitly says it only recommends genuinely stocked fragrances, contradicting the perfume-intelligence vision.
30. The metadata description repeats the same in-stock-only positioning.
31. The composer does not auto-resize, preserve drafts across navigation, cancel, edit/resend, regenerate, or display guest allowance.
32. The current response renderer supports only one paragraph, cards, and a disclaimer. It has no safe Markdown/typed-block support, tables, note pyramids, citations, sources, copy, feedback, or report action.
33. Existing Playwright and axe infrastructure covers route loading and broad accessibility, not concierge semantics, streaming, history, citations, guest conversion, or 320px overflow.
34. Environment validation marks most integrations optional and defaults AI to mock. It has no V2 limits, budgets, provider priority, web research controls, or production prohibition for mock.
35. Deployment is Vercel. There is no checked-in `vercel.json`; deployment guidance uses `prisma migrate deploy`, and CI has storefront/continuation workflows rather than concierge evaluation.

## Verified points from the reported failure list

All fifteen reported points are confirmed. The only qualification is that the recommendation engine allows explicit preorder/waitlist behavior when sample-first logic is active; it still applies availability far too early for a general perfume assistant.

## Security and privacy findings

- NextAuth uses JWT sessions with a credentials provider. The session exposes email/name and server code re-loads the stable user ID from Prisma.
- There is no guest identity cookie dedicated to the concierge.
- Existing prompt scrubbing covers basic email, card-like digits, and phone patterns, but raw private conversation persistence/logging policy does not exist.
- External content is not retrieved today, so prompt-injection handling for web pages has not been implemented.
- Product DTO boundaries protect cost/supplier/internal authenticity fields, but V2 tools must select explicit public fields rather than pass raw Prisma records.

## Baseline visual evidence

- Desktop: 1440 x 1000 screenshot captured at `%TEMP%/fade-concierge-v1-desktop.png`.
- Mobile: 375 x 812 screenshot captured at `%TEMP%/fade-concierge-v1-mobile.png`.
- Both show the in-stock-only empty-state copy. Desktop leaves most horizontal space unused. Mobile has no horizontal overflow in the empty state.
- The gstack browser daemon could not start its bundled server on this Windows host. The installed Playwright CLI produced the screenshots successfully.

## Root cause conclusion

The repeated answer is not a prompt-quality bug. It is an architectural routing bug: a commerce recommendation endpoint is being presented as a general assistant. Fixing the sentence or expanding the existing intent prompt would preserve the same failure mode. V2 needs a separate conversation orchestrator that routes knowledge, research, commerce, safety, and support tasks before selecting evidence and generating an answer.

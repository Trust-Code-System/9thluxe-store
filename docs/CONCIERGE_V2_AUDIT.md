# Concierge V2 verified audit

Audit refreshed: 2026-07-12

Branch: `feat/concierge-v2` at `8a2866c` plus the current uncommitted repair

Runtime: Next.js 16.0.7, React 19.2, Prisma 6.19.2, NextAuth 5 beta

## Repository state

- The branch tracks `origin/feat/concierge-v2`. Its head is a WIP Concierge V2 commit and must not be merged as production-ready.
- Before this repair, the only untracked file was `tests/concierge/answer-differentiation.test.ts`. It is preserved and now participates in validation.
- The only open pull request is draft PR 4, `Install Vercel Web Analytics`.
- Unfinished branches include `upgrade/backend-claude`, `upgrade/frontend-atelier`, `upgrade/frontend-sol`, and `upgrade/pdp-discovery-sol`. The continuation and mobile-verification branches have already been merged into the ancestry of this branch.
- Existing backend, PDP, Scent Intelligence, continuation, hero, and Concierge handoff/TODO documents were inspected.
- The attachment directory contains only `pasted-text.txt`. No concierge screenshot was attached. The existing WIP audit used fresh local desktop/mobile captures instead.
- Deployment guidance is Vercel-oriented. There is no checked-in `vercel.json`. The Concierge migration was applied to the configured database on 2026-07-13.

## Fresh reproduction

On 2026-07-12 the real local V1 route was started and called twice:

1. `What is an accord?`
2. `What happens when grape and wood are combined?`

Both returned the exact customer message `Here are catalogue matches for your request.`, the exact explanation `These fragrances match your requested notes and stay within your stated preferences.`, and three product cards. This proves the reported behavior is deterministic.

## Verified V1 root causes

1. `app/api/v1/concierge/route.ts` calls `recommend()` for every message. There is no perfume-knowledge, research, history, safety, support, comparison, or off-catalogue route.
2. `lib/recommendations/engine.ts` is a commerce recommender. When intent retrieval is weak, it deliberately broadens to catalogue products. It cannot act as a general perfume assistant.
3. The V1 route replaces every successful response with one fixed sentence instead of using the generated explanation as the answer.
4. The V1 client does not render the returned explanation as conversational text.
5. The legacy intent model contains only shopping-oriented intents. It cannot represent the required perfume intelligence tasks.
6. Stock and catalogue retrieval happen before the system knows whether commerce data is relevant.
7. V1 has no off-catalogue perfume representation, external-availability label, evidence scope, or citations.
8. Conversation turns live only in React state. V1 sends no conversation ID, history, constraints, summary, or referenced products.
9. `AI_PROVIDER` selects one legacy adapter. Legacy structured services retry that adapter rather than routing by task and capability.
10. The old layer can silently use deterministic mock output outside production and previously allowed it to disguise missing configuration.
11. V1 has no hosted web-research path or cited-source interface.
12. The old interface is a narrow chat column with no history, sources, cancellation, saved conversation, or contextual product rail.
13. V1 applies one IP-based per-minute limit. It has no guest success entitlement, authenticated daily allowance, search allowance, or spend gate.
14. Existing AI usage aggregation is process-local and does not provide durable per-turn Concierge observability.
15. Existing search is database substring search, not current web research. Several declared fragrance filters are not implemented in the legacy search route.

## Additional defects found in the first V2 WIP

The first WIP corrected the V1 entry point but was not acceptance-ready:

1. The API waited for the complete provider response and then split the finished answer into 80-character chunks. This was simulated transport streaming, not upstream token streaming.
2. The provider registry declared every capability for every provider without adapter-level verification. The default models are compatible, but arbitrary environment overrides are not automatically proven compatible.
3. Catalogue retrieval still replaced a failed note/query match with unrelated top-rated products. That could present a weak match as a recommendation and recreate the original product-first failure.
4. A product with zero base stock but an available variant was labelled out of stock. Sample labels could appear even when sample-first was not selected.
5. `Which is cheaper?`, ordinal references such as `the second one`, unisex filtering, and exclusions such as `not too sweet` were not reliably translated into catalogue constraints.
6. Saved assistant messages retained product IDs but the history API did not revalidate and hydrate product cards when reopening a conversation.
7. Source cards existed, but answer markers were not normalized into clickable inline citations.
8. OpenAI/xAI source extraction did not cover every Responses citation shape. URL validation blocked loopback but not all private-network or credential-bearing URLs.
9. `allowedDomains`, `blockedDomains`, and `maxSearches` were described in the web-provider interface but were not passed through to supported provider tool schemas.
10. Cost was always stored as zero, so daily and monthly spend limits could never trip.
11. First-token latency existed in the schema but was never recorded.
12. Global spend gates were skipped for guests because the entitlement function returned before checking them.
13. Authenticated per-minute limiting failed open on durable-store errors. Production could also use a per-instance in-memory limiter without surfacing that durability was missing.
14. Guest-cookie hashing used a known development fallback secret even in production when auth secrets were absent.
15. Conversation summaries were never updated. Intensity and sample-first follow-ups were not preserved reliably.
16. Provider, ownership, guest-race, xAI, production-mock, real-streaming, cost, and no-broad-fallback regression tests were missing.
17. The admin page is currently a secure status dashboard, not a runtime configuration editor. Environment changes and redeployment are still required for provider priority, limits, and kill switches.
18. The approved perfume knowledge table has no merchant-approved seed content yet. Stable general answers therefore depend on the configured model or narrow deterministic safety guidance.
19. The Prisma migration is valid and was deployed to the configured database on 2026-07-13. Database-backed history and allowance endpoints were rechecked after deployment; authenticated and concurrent multi-session preview coverage remains outstanding.
20. Real-provider citation quality and the preview deployment remain external validation gates.

## Security and data-source findings

- Product existence, publication, price, stock, variants, reviews, and product links must remain server-tool facts. The model must never create them.
- Public product tools must require `deletedAt=null` and `publishStatus=PUBLISHED` and must omit cost price, supplier fields, internal authenticity notes, and private order data.
- Approved Scent Atlas evidence currently combines merchant-published product fields with the code-owned approved ingredient library. Unapproved ingredient matches are excluded. Perceived prominence is explicitly not a formulation percentage.
- Fádé review tools require approved moderation and separate verified-purchase counts. External review claims require current cited research.
- Authenticated conversation reads use the database user ID; guest reads use a keyed cookie digest. A missing owned record returns `NOT_FOUND`, preventing cross-user enumeration.
- The feature remains additive and isolated from cart, checkout, payments, orders, inventory mutation, and admin commerce actions.

## Root-cause conclusion

The repeated answer was caused by routing every question into a catalogue recommender and then discarding the only generated explanation. The correct fix is a separate orchestration path that answers the perfume question first, invokes commerce tools only for commerce facts, retains owned conversation context, validates evidence, and streams the provider response. Prompt wording alone cannot repair the V1 architecture.

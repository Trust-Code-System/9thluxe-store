# Concierge V2 evaluation

The repeatable case list lives in `lib/concierge/evaluation.ts`; router and policy assertions live in `tests/concierge/*`.

## Dimensions

- Correct primary and secondary intent
- Correct need for catalogue, live stock, conversation context, or current web research
- Direct answer before optional commerce conversion
- No unsupported product, price, stock, variant, review, or formulation claim
- External perfume labelling
- Citation presence and URL safety when research runs
- Conversation constraint preservation
- Guest success accounting and authenticated limits
- Safety, prompt injection, XSS, and cross-user ownership
- First status event, first text event, total latency, provider latency, search count, tool count, and tokens
- Meaningfully different answers and no fixed generic opening

## Automated coverage added

- 41 representative routing questions across knowledge, notes, accords, climate, occasion, catalogue, multi-turn, layering, research, and medical safety
- Budget/note extraction
- Multi-turn active product, budget, and excluded-note state
- General knowledge does not trigger catalogue or stock
- Source URL sanitization
- Medical non-diagnostic response
- HTML and visible em dash sanitization
- V2 source regression check for the V1 fixed catalogue opening
- Browser empty-state and 320px overflow cases
- Real upstream Responses streaming and no provider switch after partial output
- Provider fallback before output, production mock prohibition, and first-class xAI routing
- No unrelated catalogue fallback after a failed scent match
- Variant stock and sample-label revalidation
- Conversation ownership and atomic guest-claim race behavior
- Verified default-model cost estimation

## Manual preview script

1. Ask `What is an accord?` and confirm no product cards.
2. Ask `What happens when grape and wood are combined?` and compare the substance and opening with step 1.
3. Follow with `Which perfume is closest to that?`, then `Which of those is in stock?`.
4. Confirm only the stock follow-up uses live availability.
5. Ask a current perfumer/reformulation question and open every source.
6. Ask for an external perfume and confirm no Fádé price/card appears.
7. Use one guest question, then confirm the next attempt shows sign-in before generation.
8. Sign in, continue the conversation, reload, search history, and verify a second user cannot open its ID.
9. Cancel a slow research turn and confirm no guest success is consumed.
10. Repeat at 320px, 375px, tablet, and desktop in dark and light themes, with keyboard and a screen reader.

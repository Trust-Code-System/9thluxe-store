# Concierge V2 architecture

## Goal

Fádé Perfume Intelligence answers the perfume question first, then uses the catalogue when commerce evidence is relevant. Models may plan and write, but they never decide product existence, publication, price, stock, variant availability, review counts, or ownership.

## Turn pipeline

```text
request and identity
  -> entitlement preflight
  -> owned conversation and bounded context
  -> safety and perfume-scope check
  -> typed intent router
  -> deterministic tool plan
  -> parallel read-only retrieval
  -> evidence and freshness validation
  -> provider selection by capability
  -> answer generation
  -> product and citation revalidation
  -> event stream
  -> atomic success accounting and durable usage
```

## Evidence scopes

- `FADE_CATALOGUE`: published, non-deleted products; current price/variants/stock; approved scent data; moderated Fádé reviews.
- `APPROVED_KNOWLEDGE`: merchant-approved original summaries and glossary/guidance entries with source metadata.
- `CURRENT_WEB`: provider-hosted web research with source URL, title, domain, kind, retrieval time, and claim-linked citations.

The response contract keeps these scopes separate. External perfumes never receive a Fádé product card, price, or stock label.

## Trust boundaries

- The orchestrator calls typed tools. The model has no Prisma, SQL, mutation, admin, stock, price, order, or customer-history access.
- Tool inputs are schema-validated and result counts are bounded.
- Product IDs proposed by a model are treated as untrusted and looked up again.
- Every public product is revalidated as `PUBLISHED`, not deleted, and currently priced before serialization.
- External content is data, never instructions. URLs use `https`, citations are returned only from provider evidence, and private/local network hosts are rejected.
- Conversation queries always include the current user ID or guest scope.

## Conversation model

The server stores a conversation, ordered messages, a compact structured state object, sources, product references, feedback, and archived status. Context includes a recent message window plus a bounded summary. The state preserves active product IDs, external perfume names, included/excluded notes, family, budget, occasion, climate, season, intensity, and sample-first preference.

Guest conversations are keyed by a random HttpOnly cookie digest. Authenticated conversations are keyed by the stable database user ID. Ownership is checked on every read/write route. Guest history is not returned after sign-in unless an explicit migration flow is implemented.

## Provider routing

Providers advertise capabilities. A task requests capabilities and a priority-ordered compatible provider is selected. A normal turn calls one primary provider. Fallback moves to the next configured compatible provider after a bounded timeout/error and circuit-breaker check. Mock is allowed only in tests, development, or explicit demo mode.

## Streaming contract

`POST /api/v2/concierge/chat` returns newline-delimited typed events:

- `status`: routing/retrieval/research progress
- `delta`: answer text increments
- `sources`: validated sources
- `products`: revalidated Fádé product cards
- `usage`: allowance remaining and safe request metadata
- `done`: persisted message and completion state
- `error`: stable safe error code and retryability

The client aborts via `AbortController`. A disconnected request does not consume a guest success allowance. Provider streams are normalized when available; deterministic/dev answers are chunked through the same contract.

## Rollout

V1 remains at `/api/v1/concierge`. V2 uses `/api/v2/concierge/*` and the `concierge_v2` flag. The kill switch can disable all V2 generation; catalogue-only fallback is a separate explicit setting and must never pretend to answer broad knowledge questions.

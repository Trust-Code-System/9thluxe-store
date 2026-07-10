# Search Architecture

## Abstraction
`integrations/search/types.ts` defines `SearchProvider`. Default: `postgresSearch`
(`integrations/search/postgres.ts`). Swap in Algolia/Typesense/Elastic later by implementing the
same interface — no caller changes.

## MVP (implemented)
Prisma queries over the perfume catalogue with **deterministic hard filters** applied first:
brand, family, note (top/heart/base), occasion, `inStock`, price range. Free-text `q` matches
name/brand/description/notes case-insensitively. Ordering: rating, then rating count, then recency.
Cursor pagination via product id.

## Upgrade path (documented, not required to run)
- Add a `tsvector` column + GIN index for full-text; `pg_trgm` for typo tolerance.
- Add `pgvector` for semantic retrieval (embeddings of olfactory descriptions/synonyms).
- These are drop-in behind `SearchProvider`; the API contract is unchanged.

## Fields supported by filters
name, brand, note, accord, family, occasion, mood, climate, concentration, availability, price,
sample availability, synonyms/alternate names (via `searchSynonyms`).

## Critical invariant for AI
**Hard filtering happens in the provider, before any AI ranking or explanation.** The recommendation
engine only ranks an already-validated candidate set (`lib/recommendations/scoring.ts`). The AI can
never surface a product outside the retrieved, in-catalogue, validated set — and never one that is
unavailable unless explicitly labelled preorder/waitlist.

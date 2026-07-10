# Frontend Performance Budget

Targets (75th percentile, representative mobile):

| Metric | Budget |
|---|---|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| Initial JS (route) | ≤ ~180 KB gzipped |
| Hero media | Poster image only on critical path; no above-the-fold video |
| Fonts | 2 families (Playfair Display, Inter), `display: swap`, subset latin |

## Practices applied
- `next/font` for both typefaces (self-hosted, swap, no layout shift).
- Hero uses a static optimized poster image (`next/image`, `priority`) — no video
  as the LCP element.
- All imagery via `next/image` with explicit `sizes` and aspect-ratio containers
  to prevent CLS.
- Animation limited to `opacity`/`transform`; ambient motion pauses under reduced-motion.
- Server components for data pages (shop, product, journal); client components only
  where interaction requires (cart, concierge, filters).

## Watch items / follow-ups
- Add route-level bundle analysis (`@next/bundle-analyzer`) in CI.
- Replace journal gradient placeholders with optimized editorial imagery when assets exist.
- Consider `next/dynamic` for the concierge client if it grows.

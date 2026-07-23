# PDP & Discovery — Working Assumptions

Recorded before implementation on branch `upgrade/pdp-discovery-sol`. These are reasonable
decisions taken to proceed without blocking. Anything that touches the backend contract is also
listed in `PDP_BACKEND_REQUIREMENTS.md`.

## Data reality (verified against the repo, not aspirational)

1. **Two data layers exist.** The legacy server service (`lib/services/product-service.ts`,
   `getProductBySlug`) reads Prisma directly and therefore has access to every column on the
   `Product` model. The newer provider-abstracted boundary
   (`integrations/commerce/*`, `CommerceProduct`) exposes a **thinner** DTO and its `toProduct()`
   mapper currently omits most fragrance fields (accords, intensity, climate, season, perfumer,
   launch year, country, mood tags, occasion, authenticity, preorder/waitlist) and synthesises a
   single default variant instead of reading the real `ProductVariant` table.
   - **Assumption:** the PDP is a server component, so it reads the rich Prisma row through a new
     **frontend-owned** typed loader (`lib/pdp/loader.ts`). This does not modify any
     backend-owned contract file. When the commerce DTO is later widened (see backend requirements
     R1–R3) the loader can switch to `getCommerce().catalog` with no component changes.

2. **Most rich columns are NULL in real data.** The seed and the legacy backfill only populate
   `fragranceFamily`, `concentration`, `notesTop/Heart/Base` (and price/images/brand/stock). Columns
   such as `mainAccords`, `olfactoryDesc`, `sillage`, `intensity`, `climate`, `season`, `timeOfDay`,
   `beginnerFriendly`, `perfumer`, `launchYear`, `countryOfOrigin`, `moodTags`, `sprayGuidance`,
   `occasion`, `batchInfo` **exist as columns but are empty**.
   - **Assumption:** every section renders **only when its data is present** and is otherwise
     hidden entirely (never an empty card, never a placeholder value). This satisfies the "hide a
     section when it has no meaningful information" rule and the "no fake data" rule simultaneously.

3. **`ProductVariant` and `ProductMedia` tables exist but are unpopulated** for the current
   catalogue. The single product price/stock lives on `Product`.
   - **Assumption:** the purchase panel treats the base product as the default full-bottle variant
     and layers real `ProductVariant` rows on top when they exist. Sample / discovery-set purchasing
     is surfaced only when a real sample variant or `DiscoverySet` is available.

4. **Provenance of subjective data.** `data-dictionary.md` states `longevity`, `sillage`,
   `intensity` are *editorial / aggregated opinion*, and `authenticityStatus` distinguishes
   `RETAILER_INSPECTED` from `MANUFACTURER_VERIFIED`.
   - **Assumption:** every subjective value is labelled with its source
     (`Brand-provided` · `Fádé editorial` · `Verified customers`) using a small provenance chip, and
     never presented as a laboratory fact.

## Endpoint reality

5. Working, catalogue-grounded endpoints used by the PDP: `GET /api/v1/products/[slug]`,
   `GET/POST /api/v1/reviews`, `GET /api/v1/reviews/summary`, `GET /api/v1/recommendations`,
   `POST /api/v1/layering`, `GET/POST /api/v1/quiz`, `POST /api/v1/back-in-stock`,
   `GET /api/v1/discovery-sets`, `POST /api/v1/concierge`. The legacy `GET /api/reviews` also exists.
6. **No Q&A endpoint exists.** Product questions/answers (section 17) has no model or route.
   - **Assumption:** build the typed frontend boundary + an intentional "unavailable in this
     environment" state; document the required contract (R7).
7. **No public performance-aggregation endpoint** breaks down longevity/projection/value by count of
   contributing reviews. Structured per-review ratings exist (`longevityRating`, `sillageRating`,
   `valueRating`) and are aggregated **server-side in the loader** from approved reviews.
8. **Wishlist** has a model + `app/account/wishlist`; **Scent Wardrobe** (owned / tried / private
   rating / wear log) has no model.
   - **Assumption:** wishlist uses the existing client store; Wardrobe actions render as a documented
     unavailable state (R8).

## Design / UX assumptions

9. The existing "Olfactory Atelier" design system (`app/globals.css`, warm parchment/espresso/amber,
   Playfair serif + Inter sans, `.dark` theme) is the source of truth; the PDP extends it and does
   **not** introduce a competing palette or animation library. Motion uses CSS + existing
   `tw-animate-css`; no new heavy animation dependency is added (Motion for React is not installed and
   adding it is out of scope for a perf-first mobile page — CSS covers every required transition).
10. Currency is whole-Naira integers formatted with `lib/format.ts`. Price-per-millilitre is derived
    from the size string (e.g. `100ml`) when parseable, otherwise hidden.
11. Analytics events are dispatched through a typed, side-effect-free client dispatcher
    (`lib/analytics/pdp-events.ts`) that forwards to `window.dataLayer`/Vercel Analytics when present
    and is a no-op otherwise. Sensitive Fragrance-DNA answers and full AI conversations are **never**
    forwarded to third-party analytics.
12. `prefers-reduced-motion` is respected globally (already wired in `globals.css`) and per-component
    for viewport-triggered reveals.

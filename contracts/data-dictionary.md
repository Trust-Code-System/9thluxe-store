# Data Dictionary (public + internal)

This lists the fields the backend exposes to the storefront (public) and the private fields that
are **never** exposed through public APIs. Full model detail lives in `docs/DATA_MODEL.md`.

## Money
All monetary values are **whole Nigerian Naira integers** (`*NGN`), never floats. Currency is
carried explicitly (`currency`, default `NGN`).

## Product — public (safe to expose)
`id`, `shopifyId?`, `slug`, `name`, `brand`, `description`, `longDescription?`, `story?`,
`priceNGN`, `oldPriceNGN?` (compare-at), `currency`, `images[]`, `videos[]?`,
`fragranceFamily`, `mainAccords[]`, `notesTop`, `notesHeart`, `notesBase`, `concentration`,
`longevity`, `sillage`, `intensity`, `season?`, `occasion?`, `climate?`, `timeOfDay?`,
`beginnerFriendly?`, `moodTags[]?`, `launchYear?`, `perfumer?`, `countryOfOrigin?`,
`variants[]` (size, priceNGN, sampleSize?, inStock), `ratingAvg`, `ratingCount`, `inStock`,
`isNew`, `isBestseller`, `isLimited`, `isPreorder?`, `waitlist?`,
`seo { pageTitle, metaDescription, canonical?, structuredData }`, `authenticityStatus`,
`lastVerifiedAt?`.

## Product — private (NEVER in public APIs)
`costPriceNGN`, `supplier`, `supplierLeadTimeDays`, `reorderPoint`, `internalAuthenticityNotes`,
`batchInfo`, `packagingInspectionRecord`, `manufacturerDocRef`, `sourcingRecord`, margin inputs.
Enforced by DTO mappers (`toPublicProduct`) that omit these; admin DTOs include them behind authz.

## Customer — public-to-self only
`id`, `name`, `email`, notification/marketing preferences, `loyaltyTier`, addresses (own),
scent profile (own), wishlists (own), orders (own). Never exposed cross-customer. Staff access is
role-gated and access-logged.

## Order — customer-visible
`id`, `status`, `subtotalNGN`, `discountNGN`, `shippingNGN`, `totalNGN`, `items[]`, `reference?`,
shipping snapshot (`addressLine1`, `city`, `state`, `phone`), gift options, `createdAt`,
fulfilment/tracking where available. Payment provider raw payloads are never exposed.

## Subjective performance data
`longevity`, `sillage`, `intensity` are **editorial / aggregated customer opinion**, not scientific
claims. `authenticityStatus` distinguishes `RETAILER_INSPECTED` from `MANUFACTURER_VERIFIED`.

## Identifiers
Internal ids are cuid strings. `shopifyId` is the Shopify GID when Shopify is the source of truth.
Product feed for agentic channels uses the stable `id` + `slug` + `variantId`.

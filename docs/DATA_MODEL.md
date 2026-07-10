# Data Model

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). Money is whole-Naira `Int`.

## Perfume catalogue
- **Product** — identity (`sku`, `barcode`, `shopifyId`, `brand`, `launchYear`, `perfumer`,
  `countryOfOrigin`, `publishStatus`), fragrance structure (`concentration`, `mainAccords`,
  `notesTop/Heart/Base`, `olfactoryDesc`, `searchSynonyms`, `moodTags`, `fragranceFamily`),
  performance (`longevity`, `sillage`, `intensity`, `sprayGuidance`, `climate`, `season`,
  `timeOfDay`, `beginnerFriendly` — **editorial/aggregated, not scientific**), commerce
  (`priceNGN`, `oldPriceNGN`, `stock`, `returnEligible`, `isPreorder`, `isWaitlist`, `weightGrams`,
  `shippingClass`), **private** (`costPriceNGN`, `supplierId`, `reorderPoint`, `internalAuthNotes`),
  trust (`authenticityStatus` = RETAILER_INSPECTED | MANUFACTURER_VERIFIED, `batchInfo`,
  `lastVerifiedAt`).
- **ProductVariant** — bottle/sample sizes, `sku`, price, `isSample`, per-variant stock.
- **ProductMedia** — images/videos with position + alt.
- **Supplier** — private supplier metadata + lead time.

Removed (non-perfume): `material`, `lensType`, `warranty`, `waterResistance` and all watch/glasses
imagery. See the migration `20260710000000_backend_upgrade_perfume`.

## Customer + intelligence
`ScentProfile`, `ScentQuizSession`, `ConsentRecord`, `LoyaltyLedger`, `Referral`, `SampleCredit` +
`CreditRedemption` (unique `[creditId, orderId]` prevents duplicate redemption), `DiscoverySet` +
`DiscoverySetItem`, `SupportConversation`, `BackInStockSubscription` (unique `[productId, email]`),
`RecommendationRequest` (records `merchandising` weights + optional `feedback`).

## Reviews
`Review` gains `orderId` + `verifiedPurchase`, structured sub-ratings (longevity/sillage/value),
and moderation (`moderationStatus`, `moderatedAt/By`, `reportedCount`). AI review summaries are
never stored as reviews.

## Operational + governance
`NotificationLog` (unique `dedupeKey`), `AuditLog`, `ApprovalRequest` (+ `ApprovalStatus`),
`IntegrationEvent`, `WebhookReceipt` (unique `[provider, eventId]` for idempotency),
`IdempotencyKey`, `JobRun` (+ `JobStatus`), `FeatureFlag`.

## Public vs private exposure
Public DTOs omit `costPriceNGN`, `supplier*`, `reorderPoint`, `internalAuthNotes`, `batchInfo`.
See `contracts/data-dictionary.md`.

## Integrity highlights
- Cascades on child records (variants/media/profile/quiz/consent/ledger/credits/set items).
- Indexes for `publishStatus`, `brand`, moderation status, webhook/job status, audit targets.
- Unique constraints guard idempotency (webhook receipt, dedupe key, credit redemption).

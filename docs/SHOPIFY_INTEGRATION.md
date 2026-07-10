# Shopify Integration

Status: **adapter implemented, BLOCKED on credentials + an approved product import.** The store
runs on the local Postgres commerce provider until Shopify is configured and the `shopify_commerce`
feature flag is enabled.

## Layers
- `integrations/commerce/shopify/client.ts` — typed Storefront/Admin GraphQL client with timeout,
  bounded retry + backoff, 429/`THROTTLED` rate-limit awareness, correlation id, normalized errors.
- `integrations/commerce/shopify/index.ts` — `CommerceProvider` implementation. Catalogue reads
  (`listProducts`, `getProductBySlug`, `getProductById`, `listCollections`) are mapped from the
  Storefront API. Cart/customer/order/inventory/promotion throw `FEATURE_DISABLED` until the
  approved import defines the mapping — we do not guess mappings.

## Selection
`registry.getCommerce()` returns Shopify only when `SHOPIFY_STORE_DOMAIN` +
`SHOPIFY_STOREFRONT_API_TOKEN` are set **and** `shopify_commerce` is enabled; otherwise `localCommerce`.

## Required capabilities (mapping plan)
Products, variants, collections, media, metafields/metaobjects (fragrance notes/accords),
inventory availability, pricing + compare-at, Markets, discounts, carts + checkout URL handoff,
customer accounts, orders, fulfilment, returns boundary, webhooks, publishing status, channel
attribution. Notes/accords/performance live in **metafields/metaobjects** since Shopify has no
native perfume fields.

## Webhooks
`x-shopify-hmac-sha256` (base64 HMAC-SHA256) verified with the webhook secret; `x-shopify-webhook-id`
is the idempotency key recorded in `WebhookReceipt`. Topics: `products/update`,
`inventory_levels/update`, `orders/create`, `orders/updated`, `fulfillments/create`, `refunds/create`.

## To enable (owner action)
1. Create a custom app; grant Storefront + Admin scopes.
2. Set `SHOPIFY_*` env vars; set webhook secret.
3. Run an **approved** import mapping local products → Shopify (no auto-publish of prices).
4. Enable `shopify_commerce` in `FEATURE_FLAGS`; complete cart/checkout mapping; run contract tests.

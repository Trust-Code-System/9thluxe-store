# Production Readiness and System Architecture Plan

## Executive summary

The application should currently be treated as a feature-rich staging build, not a production-ready
commerce system. The most urgent risk is payment integrity: prices, discounts, shipping costs,
payment amounts, and Paystack metadata cross the client/server boundary without sufficient
server-side ownership and reconciliation.

The recommended target is a **modular monolith**:

- one Next.js application and deployment;
- one PostgreSQL database;
- clearly separated business modules inside the application;
- Redis for distributed rate limits, short-lived cache entries, and optionally job coordination;
- durable background processing through an outbox and worker;
- external providers behind adapters rather than called directly from pages and route handlers.

This is the appropriate architecture for the current product and team size. Microservices would add
deployment, networking, observability, and consistency problems without solving the present trust
and reliability issues.

## Implementation status

Work started on branch `codex/production-readiness`.

Completed in the first hardening milestone:

- public catalogue queries now require published, non-deleted products;
- checkout recalculates product prices, coupons, shipping, gift wrapping, and totals on the server;
- Paystack initialization requires authentication and a customer-owned pending order;
- Paystack receives the stored order amount and a server-generated reference;
- the Paystack webhook validates signature, reference, status, amount, currency, and payment method;
- the paid transition and non-negative stock decrement are transactionally guarded;
- the checkout success page is read-only and scoped to the signed-in customer;
- placeholder bank-transfer details were removed and transfer is fail-closed until configured;
- checkout and payment initialization use the distributed rate-limiter abstraction;
- critical cookie-authenticated payment mutations validate request origin;
- production readiness now requires database, authentication, Paystack, Resend, and Redis settings;
- baseline security headers were added;
- checkout creation now uses a customer-scoped idempotency key and request fingerprint;
- Paystack initialization now uses a durable `PaymentAttempt` ledger, with safe retry behavior;
- webhook processing resolves the server-created payment attempt rather than trusting provider
  metadata as the source of truth;
- each successful attempt is recorded before the order transition, including duplicate successful
  payments that require operational review;
- checkout now atomically reserves available stock and records an inventory movement;
- card reservations expire after 30 minutes and bank-transfer reservations after 24 hours;
- a protected, idempotent expiration job releases stock exactly once;
- successful payment finalizes the reservation without decrementing stock twice, while legacy
  pending orders retain a safe conditional-decrement path;
- concurrent database tests prove only one checkout can claim the final available units;
- the payment transaction now writes separate durable outbox events for receipts, admin
  notifications, and referral qualification;
- the protected outbox worker claims work safely, recovers stale locks, retries with exponential
  backoff, and retains exhausted events in a failed state;
- receipt delivery uses provider idempotency, admin notifications use a database deduplication key,
  and customer-controlled receipt fields are HTML escaped;
- payment-matching, checkout-idempotency, publication, origin, and shipping-policy regression tests
  were added;
- Prisma schema validation, TypeScript, lint, 337 unit/integration tests, and the production build
  pass on this branch; all staging migrations are applied with zero schema drift.

Still required before launch:

- payment reconciliation and complete refund/order state handling;
- complete password-reset flow and broader authentication abuse protection;
- dependency remediation, full database integration tests, and production staging certification;
- scheduler configuration for the reservation-expiry and outbox-worker endpoints;
- owner-supplied provider credentials, business details, brand assets, and approved policies.

## Audit findings

This is the original audit list. Items completed on `codex/production-readiness` are marked
**resolved on branch**; they still require migration and staging certification before release.

### Critical

1. **Resolved on branch:** checkout previously accepted browser-supplied discount, shipping, coupon
   ID, total, and payment amount.
2. **Resolved on branch:** Paystack initialization previously accepted arbitrary client metadata and
   was not tied to a server-owned order.
3. **Resolved on branch:** the webhook previously trusted `metadata.orderId` without comparing the
   paid amount and currency with the stored order and payment attempt.
4. **Resolved on branch:** the checkout success page previously mutated payment state during a GET
   request.
5. Password-reset emails point to a reset route that does not exist, and there is no endpoint that
   applies a new password.
6. Bank transfer displays the placeholder account number `0123456789`.
7. The production dependency audit reports seven high and four moderate vulnerabilities.

### High priority

1. **Resolved on branch:** there was no reliable stock reservation or atomic non-negative stock
   decrement.
2. **Resolved on branch:** public catalogue queries did not consistently require
   `publishStatus = PUBLISHED`.
3. Custom state-changing endpoints do not consistently validate request origin or CSRF protections.
4. Signup, password reset, order creation, and payment initialization lack durable abuse controls.
5. Contact-form values are interpolated into HTML emails without HTML escaping.
6. Required production configuration does not fail fast at startup.
7. Missing favicon, PWA icons, and Open Graph image cause broken metadata assets.
8. CI does not gate releases on all unit, integration, browser, dependency, build, and migration
   checks.

## Target modular-monolith design

```text
Browser
  |
  +-- Storefront
  +-- Customer account
  +-- Admin application
  |
  v
Next.js delivery layer
  |
  +-- Authentication and authorization middleware
  +-- Request validation, origin checks, and rate limits
  +-- Route handlers, server actions, and server-rendered pages
  |
  v
Application modules
  |
  +-- Identity
  +-- Catalogue
  +-- Cart
  +-- Checkout
  +-- Payments
  +-- Inventory
  +-- Orders
  +-- Promotions
  +-- Customers and loyalty
  +-- Notifications
  +-- Admin and audit
  |
  +------------------+--------------------+--------------------+
  |                  |                    |                    |
  v                  v                    v                    v
PostgreSQL         Redis              Job worker         Provider adapters
source of truth    cache/limits       outbox consumer    Paystack/Resend/etc.
```

The modules are logical boundaries within one codebase. They should communicate through explicit
application services and domain events, not by importing arbitrary database operations from one
another.

### Suggested module layout

```text
modules/
  identity/
    application/
    domain/
    infrastructure/
  catalogue/
  checkout/
  payments/
  inventory/
  orders/
  promotions/
  notifications/
  admin/

integrations/
  paystack/
  resend/
  redis/

app/
  api/               Delivery layer only
  ...                Pages and layouts

lib/platform/
  database/
  cache/
  jobs/
  logging/
  security/
```

An immediate reorganization is not required. New and repaired flows can adopt these boundaries
incrementally, then older code can be moved as it is touched.

## Where the system-design concepts belong

### Caching

Caching belongs primarily on read-heavy, non-authoritative data.

Good cache candidates:

- published product cards and collection pages;
- category and brand lists;
- product recommendations;
- approved review summaries;
- journal content;
- expensive, non-personalized search results;
- short-lived provider capability/status information.

Data that should not be trusted from cache when making a transaction:

- price used for checkout;
- stock availability used to accept an order;
- coupon validity and remaining uses;
- payment status;
- order ownership or authorization;
- loyalty balance used for redemption;
- user roles.

Recommended policy:

```text
Read catalogue
  -> check framework/Redis cache
  -> query PostgreSQL on miss
  -> cache only the public DTO

Create order
  -> always read authoritative prices, stock, coupon, and user from PostgreSQL
  -> never trust cached transactional values
```

Use short TTLs and explicit invalidation after product publication, price changes, stock changes, and
review moderation. Include a schema/version component in keys, for example
`catalogue:v2:product:{slug}`. Do not cache raw Prisma models containing private fields.

### Background jobs

Background jobs belong after a transaction when work is important but should not delay or break the
customer request.

Suitable jobs:

- order receipts and status emails;
- admin payment notifications;
- abandoned-checkout reminders;
- expired inventory-reservation release;
- payment reconciliation;
- newsletter batches;
- product-feed synchronization;
- low-stock alerts;
- search-index updates;
- analytics aggregation;
- image processing;
- webhook reprocessing.

Use the transactional outbox pattern:

```text
Database transaction
  1. Mark order PAID
  2. Finalize inventory
  3. Insert ORDER_PAID outbox event
  4. Commit

Worker
  1. Claim event
  2. Send receipt
  3. Notify admin
  4. Retry transient failures
  5. Mark event completed
```

This avoids the dual-write problem where the database commits but the email or queue operation is
lost. Jobs need unique idempotency keys, bounded retries, exponential backoff with jitter, and a
dead-letter/manual-review state.

### Rate limiting

Rate limiting belongs at the delivery boundary, before expensive provider calls or database writes.
Redis-backed counters are required when the application has more than one process or serverless
instance.

Apply limits to:

- sign-in attempts by IP and normalized email;
- signup by IP and device/session;
- password-reset requests by IP and normalized email;
- password-reset token attempts;
- order creation by authenticated user and IP;
- payment initialization by order, user, and IP;
- coupon guessing by user and IP;
- contact and newsletter forms;
- review creation and reporting;
- search and AI endpoints;
- drop and back-in-stock subscriptions;
- admin exports and bulk operations.

Rate limiting is not authorization. An allowed request must still pass authentication, ownership,
validation, and business rules.

### Idempotency

Idempotency belongs anywhere a request may be repeated because of double-clicks, retries, timeouts,
provider redelivery, or worker crashes.

Required idempotency boundaries:

- checkout/order creation;
- Paystack initialization;
- Paystack webhook handling;
- payment reconciliation;
- refund creation;
- inventory finalization and release;
- loyalty accrual and reversal;
- coupon use increment;
- email and notification jobs;
- admin bulk actions;
- external catalogue synchronization.

Use database uniqueness as the final enforcement mechanism:

```text
PaymentAttempt.providerReference       UNIQUE
WebhookReceipt(provider, eventId)      UNIQUE
OutboxEvent.idempotencyKey             UNIQUE
InventoryMovement(sourceType, sourceId, productId) UNIQUE
LoyaltyLedger(reason, orderId, userId) UNIQUE where appropriate
```

For browser-initiated checkout, accept an `Idempotency-Key` generated once per checkout attempt.
Store the key, authenticated user, request fingerprint, and resulting order. Reusing the key with a
different payload must be rejected.

### Transactions and consistency

PostgreSQL transactions should protect business invariants that must succeed or fail together.

The payment-confirmation transaction should include:

1. lock or conditionally update the payment attempt;
2. conditionally transition the order from a payable state to `PAID`;
3. finalize or decrement stock without allowing it to become negative;
4. increment coupon usage once;
5. write loyalty movements once;
6. record inventory movements;
7. create outbox events;
8. commit.

External network requests should generally occur outside database transactions. Verify Paystack
first, then open the short database transaction that records the verified result.

### Inventory reservations and concurrency control

The current check-now/decrement-later flow can oversell. The preferred design is:

```text
AVAILABLE -> RESERVED -> SOLD
                     \-> RELEASED or EXPIRED
```

An `InventoryReservation` records the order, product, quantity, expiry, and state. Checkout reserves
stock for a limited period. Successful payment converts the reservation to sold; a scheduled job
releases expired reservations.

For an initial simpler implementation, use an atomic conditional decrement and verify that the
number of affected rows is correct. Never read stock and later write a decrement without a database
condition or lock.

### Retries, timeouts, and circuit breakers

Every external call needs an explicit timeout. Retry only transient failures and only when the
operation is idempotent.

- Paystack verification: short timeout, bounded retries, reconciliation fallback.
- Paystack initialization: idempotency key and bounded retry.
- Resend: background retry, not request blocking.
- Shopify/catalogue synchronization: cursor checkpointing and bounded retry.
- AI/search providers: strict timeout, budget, and graceful fallback.

A simple in-process circuit breaker or shared provider-health state may be added once provider
failures become operationally significant. It is less urgent than correct timeouts and idempotency.

### Event-driven design inside the monolith

The system can use domain events without becoming microservices. Events should describe completed
facts, such as:

- `OrderCreated`
- `PaymentConfirmed`
- `OrderPaid`
- `InventoryLow`
- `OrderShipped`
- `RefundCompleted`
- `ProductPublished`

Durable events go through the outbox. Purely local, non-critical reactions can use in-process
handlers. Business-critical effects must not rely only on an in-memory event emitter.

### Observability

Observability cuts across every module.

Required signals:

- structured logs with request and correlation IDs;
- errors grouped by route, module, and provider;
- request latency and error rate;
- Paystack initialization and webhook success rates;
- payment amount/currency mismatch alerts;
- payment reconciliation backlog;
- job queue depth, age, retries, and dead letters;
- inventory reservation expiry and negative-stock alerts;
- authentication and rate-limit anomalies;
- database pool and query health;
- email delivery failures;
- deployment and migration markers.

Logs must redact tokens, passwords, secrets, addresses, full webhook payloads, and unnecessary
personal information.

### Audit logging

Audit logging is different from diagnostic logging. It records who changed business state, what was
changed, and why.

Audit:

- refunds and payment overrides;
- order-status changes;
- manual bank-transfer confirmation;
- inventory adjustments;
- price and publication changes;
- coupon changes;
- admin role changes;
- customer-data exports;
- newsletter sends.

Audit records should be append-only from the application and contain actor, action, resource,
before/after summary, timestamp, request ID, and optional reason.

### Security boundaries

Each request should pass through these layers:

```text
TLS
 -> security headers
 -> request size limit
 -> origin/CSRF validation
 -> rate limit
 -> authentication
 -> authorization and ownership
 -> schema validation
 -> application service
 -> transaction/business invariants
 -> redacted response and logging
```

Admin UI protection is not sufficient; every admin route handler and server action must authorize
independently.

### Health, readiness, and graceful degradation

Use separate endpoints:

- liveness: process is running;
- readiness: required database/configuration is available;
- dependency status: provider and worker health for admin/monitoring use.

Missing `DATABASE_URL`, authentication secrets, production URL, or required payment configuration
must prevent a production deployment from becoming ready. Optional services may degrade gracefully,
but checkout should fail closed when payment or transactional storage is unavailable.

### Backups and disaster recovery

Production readiness includes:

- automated PostgreSQL backups and point-in-time recovery;
- documented retention;
- a restore test, not just backup creation;
- migration rollback/forward-fix procedure;
- secret rotation procedure;
- defined recovery time and recovery point objectives;
- reconciliation after recovery so payment and order state can be compared with Paystack.

## Payment system design

### Correct request flow

```text
1. Browser submits product IDs, quantities, address, delivery method, coupon code, and gift choices.
2. Server authenticates the customer.
3. Server loads published products and authoritative prices from PostgreSQL.
4. Server validates coupon, shipping, gift cost, stock, and order limits.
5. Server creates Order, OrderItems, reservations, and PaymentAttempt in a transaction.
6. Server initializes Paystack with the stored amount, currency, and server reference.
7. Browser redirects to the Paystack authorization URL.
8. Paystack sends a signed webhook.
9. Server verifies signature, reference, status, amount, and currency.
10. Server atomically marks payment/order paid, finalizes stock, and writes outbox events.
11. Worker sends receipt and admin notification.
12. Success page reads customer-owned order status and never mutates it.
13. Scheduled reconciliation checks unresolved payment attempts against Paystack.
```

### Recommended data model additions

```text
PaymentAttempt
- id
- orderId
- provider
- providerReference UNIQUE
- idempotencyKey UNIQUE
- expectedAmount
- expectedCurrency
- status
- providerTransactionId
- initializedAt
- verifiedAt
- failureCode

InventoryReservation
- id
- orderId
- productId
- quantity
- status
- expiresAt
- createdAt

InventoryMovement
- id
- productId
- delta
- reason
- sourceType
- sourceId
- createdAt

OutboxEvent
- id
- type
- aggregateType
- aggregateId
- payload
- idempotencyKey UNIQUE
- status
- attempts
- availableAt
- processedAt
- lastErrorRedacted

PasswordResetToken
- id
- userId
- tokenHash UNIQUE
- expiresAt
- usedAt
- createdAt
```

Recommended order states:

```text
PENDING_PAYMENT
PAYMENT_REVIEW
PAID
PROCESSING
SHIPPED
DELIVERED
CANCELLED
PAYMENT_FAILED
REFUND_PENDING
REFUNDED
```

State transitions must be validated centrally rather than allowing arbitrary status updates.

## Implementation roadmap: easiest to hardest

### Phase 0: Release lockdown and configuration

Difficulty: easy  
Estimated engineering time: 0.5 to 1 day

- disable unsafe card payment until the redesigned flow is complete;
- disable bank transfer until genuine details and verification procedures are approved;
- add missing favicon, PWA icons, and Open Graph image;
- enforce required production environment variables;
- prevent localhost production metadata;
- self-host fonts;
- remove development mock behaviour from production.

### Phase 1: Catalogue, SEO, and baseline security

Difficulty: easy to medium  
Estimated engineering time: 2 to 4 days

- enforce published-product filtering everywhere;
- remove transactional pages from the sitemap;
- add security headers and origin checks;
- add request-size limits and common error handling;
- escape HTML email values;
- upgrade vulnerable production dependencies;
- establish Redis-backed rate limiting;
- add readiness checks.

### Phase 2: Identity and account recovery

Difficulty: medium  
Estimated engineering time: 2 to 4 days

- implement complete password reset;
- store reset-token hashes;
- normalize email consistently;
- align signup and login password policies;
- add login, signup, and reset abuse protection;
- remove process-global session-duration state;
- add security-event logging and session invalidation.

### Phase 3: Payment and checkout redesign

Difficulty: hard  
Estimated engineering time: 5 to 8 days

- make prices, coupons, shipping, and totals server-owned;
- add `PaymentAttempt` and checkout idempotency;
- initialize Paystack only from the stored order;
- validate webhook amount, currency, status, and reference;
- use constant-time signature comparison;
- make the success page read-only;
- add reconciliation and refund flows;
- add real Paystack test-mode integration tests.

### Phase 4: Inventory and order reliability

Difficulty: hard  
Estimated engineering time: 3 to 6 days

- add reservations or atomic conditional stock updates;
- add inventory movements;
- centralize order-state transitions;
- add expiry/release jobs;
- make coupon, loyalty, and stock effects idempotent;
- implement cancelled, failed, review, and refund states.

### Phase 5: Durable background work and operations

Difficulty: medium to hard  
Estimated engineering time: 3 to 6 days

- add outbox events and worker execution;
- move email and non-critical notifications out of webhooks;
- add retry and dead-letter handling;
- add audit logging;
- add provider timeouts and bounded retries;
- add operational dashboards and alerts;
- document payment, outage, oversell, and rollback runbooks.

### Phase 6: CI/CD and release certification

Difficulty: hard  
Estimated engineering time: 4 to 7 days

Require on every pull request:

- clean dependency installation;
- Prisma validation and migrations against temporary PostgreSQL;
- seed validation;
- TypeScript and ESLint;
- unit and integration tests;
- payment security regression tests;
- production build;
- Playwright storefront and account flows;
- accessibility audit;
- production dependency audit.

Then certify staging with Paystack test mode before enabling production credentials.

### Phase 7: Business and compliance readiness

Difficulty: primarily owner/legal/operations work  
Estimated elapsed time: 3 to 10 days in parallel

- legal identity and business address;
- real bank details and manual verification procedure;
- Paystack merchant approval;
- verified email domain with SPF, DKIM, and DMARC;
- support contacts and service hours;
- approved shipping, returns, cancellation, and refund policies;
- privacy, cookies, analytics, retention, and customer-rights review;
- product-authenticity claims and inventory source of truth;
- tax and invoice requirements.

## Architecture decisions

### Remain a modular monolith

Keep the modular monolith while:

- one team owns most of the system;
- the catalogue and transaction load fit a shared PostgreSQL deployment;
- modules can be deployed together;
- independent scaling is not an established bottleneck;
- operational simplicity is more valuable than independent services.

### Consider extracting a service only when evidence exists

A module becomes a service candidate when it has several of these properties:

- a separate team and release cadence;
- materially different scaling needs;
- strong isolation or compliance requirements;
- a stable, explicit API boundary;
- repeated deployment contention in the monolith;
- operational maturity for distributed tracing, service authentication, and failure handling.

Likely future candidates are notifications/workers, search, or AI workloads. Payments and orders
should not be separated merely for architectural fashion; their consistency is easier to preserve
inside the monolith and shared transaction boundary.

## Production definition of done

The store is ready for a controlled production launch only when:

- the browser cannot control transactional prices or payment identity;
- payment amount, currency, status, and reference are verified server-side;
- webhook and job replays cannot duplicate business effects;
- stock cannot become negative through concurrent checkout;
- password reset works end to end;
- drafts and private product fields cannot reach public surfaces;
- required rate limits and authorization checks use production infrastructure;
- required configuration fails closed;
- production dependencies have no unaccepted high-severity findings;
- migrations, backups, restore, monitoring, and rollback have been tested;
- staging has completed a real Paystack test-mode purchase and refund;
- CI blocks regression of the critical invariants;
- the owner has approved all customer-facing commercial and legal information.

The expected total for one experienced engineer is approximately four to seven weeks, excluding
external approvals and business/legal content. The safest launch is a small controlled release after
staging certification, followed by close monitoring and daily payment reconciliation.

# 9thluxe Store / Fàdè Essence

An editorial perfume-commerce platform combining a customer storefront, operational administration, checkout, catalogue management, and a provider-abstracted perfume concierge.

> **Status:** Active development. The public deployment is available at [9thluxe-store.vercel.app](https://9thluxe-store.vercel.app), but production readiness still depends on deployment-specific payment, email, database, storage, and AI-provider configuration.

![Editorial perfume collection](./public/luxury-perfume-bottles.png)

## Product scope

### Storefront

- Perfume catalogue, search, filters, brands, collections, and product detail pages.
- Persistent cart, discount handling, delivery options, checkout, and Paystack integration.
- Customer accounts with orders, addresses, reviews, wishlist, and preferences.
- Responsive editorial presentation, theme support, metadata, sitemap, and structured navigation.

### Administration

- Product, brand, collection, category, inventory, and order workflows.
- Payment verification, order-state management, exports, and operational notifications.
- Newsletter campaign and subscriber management through Resend-backed delivery.
- Concierge observability for provider status, latency, errors, limits, and feedback.

### Perfume concierge

The concierge supports multi-turn perfume discovery, comparisons, layering, climate and occasion guidance, and catalogue-grounded recommendations. Generation providers are selected through a server-side abstraction; optional web research remains separately configured.

## Architecture

```text
app/            Next.js routes, server actions, and API handlers
components/     Storefront, admin, product, cart, and shared UI
lib/            Auth, validation, services, stores, and integrations
prisma/         PostgreSQL schema, migrations, and seed tooling
emails/         Transactional and campaign email templates
tests/          Unit, integration, browser, theme, and accessibility checks
e2e/            Additional end-to-end workspace
docs/           Product and implementation documentation
```

The application uses the Next.js App Router for the storefront, account area, admin platform, and API surface. Prisma owns relational persistence, NextAuth handles sessions, Zod validates boundaries, and Zustand coordinates selected client state.

## Stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| Interface | Tailwind CSS, Radix UI, Motion, Zustand, React Hook Form |
| Data | PostgreSQL, Prisma |
| Identity | NextAuth.js v5, bcrypt |
| Commerce | Paystack, server-side checkout and order workflows |
| Messaging | Resend |
| AI | Configurable OpenAI, Anthropic, Google, or xAI providers |
| Quality | ESLint, TypeScript, Vitest, Playwright, axe-core |

## Local setup

### Prerequisites

- Node.js compatible with Next.js 16
- npm
- PostgreSQL

### Install

```bash
npm ci
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000`.

Use [`.env.example`](./.env.example) as the complete variable-name reference. Never commit real database URLs, authentication secrets, provider keys, payment keys, or service-role credentials.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run build` | Create a production build |
| `npm run lint` | Run copy and ESLint checks |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest suite |
| `npm run test:e2e` | Run storefront browser tests |
| `npm run test:a11y` | Run automated accessibility checks |
| `npm run test:theme` | Verify supported themes |
| `npm run seed` | Seed the configured development database |

## Deployment

Before deploying:

1. provision PostgreSQL and apply reviewed migrations;
2. configure the canonical application URL and authentication secrets;
3. configure Paystack webhooks against the production domain;
4. verify Resend sender identity and templates;
5. configure only the required AI providers;
6. run lint, typecheck, unit, browser, accessibility, and build checks;
7. test checkout, admin authorization, inventory, email, and webhook replay behavior.

## Security and privacy

- Keep payment verification, service-role access, and AI-provider credentials server-side.
- Treat webhook authentication and idempotency as deployment gates.
- Do not copy production customer or order data into development environments.
- Review role checks for every admin mutation and export.
- Rate-limit authentication, checkout, contact, newsletter, and concierge endpoints.
- Sanitize generated or editor-authored HTML before rendering.

If a credential has ever been committed, removing it from the current tree is not sufficient—rotate it at the provider and review repository history.

## Documentation

- [`docs/`](./docs/) — product and implementation records
- [`e2e/README.md`](./e2e/README.md) — end-to-end workspace guidance
- [`NEWSLETTER_INTEGRATION.md`](./NEWSLETTER_INTEGRATION.md) — newsletter integration notes
- [`REGENERATE_PRISMA.md`](./REGENERATE_PRISMA.md) — Prisma generation guidance

## Ownership and licence

This is a collaborative product repository. Commit and pull-request history should be used when describing individual contributions.

No open-source licence is currently granted. Public visibility does not by itself permit reuse, modification, or redistribution.

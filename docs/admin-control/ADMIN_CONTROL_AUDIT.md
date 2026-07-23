# ADMIN CONTROL AUDIT — 9CH / Fádé

> Phase 0 repository inspection. Every finding below is grounded in files that exist in
> this repository as of the audit date. No findings are invented.

**Audit date:** 2026-07-18
**Auditor:** Aries (admin-control initiative)
**Canonical naming:** Codebase ships as **Fádé** (a.k.a. "Fádé Essence"), the storefront brand
for the **9CH** project. Admin surfaces are labelled "Fádé Admin". Naming is **preserved** — no
global rename performed.

---

## 1. Stack & architecture (from `package.json`, config files)

| Concern | Implementation |
| --- | --- |
| Framework | Next.js **16.0.7**, App Router, React **19.2** |
| Language | TypeScript (`tsc --noEmit` typecheck script) |
| DB / ORM | PostgreSQL via **Prisma 6.19** (`prisma/schema.prisma`) |
| Auth | **NextAuth 5 beta** (credentials), `lib/auth.ts` + `app/api/auth/[...nextauth]` |
| Authorization | `lib/admin.ts` — `requireAdmin()` (pages) / `getAdminUser()` (APIs). Binary `Role` enum `USER`/`ADMIN`. Bootstrap via `ADMIN_EMAILS` env. |
| State | Zustand (`lib/stores/cart-store.ts`), server cart via cookies |
| UI | Radix primitives + custom components under `components/ui/*` |
| Styling | Tailwind (`tailwind.config.ts`), `app/globals.css`, night/day surfaces |
| Forms / validation | react-hook-form + zod (`@hookform/resolvers`) |
| Payments | Paystack (`app/api/paystack/*`) |
| Email | Resend (`emails/*`) |
| Media | Product-scoped only (`ProductMedia`); URLs are strings. No general asset library / upload service found. |
| Testing | Vitest (unit) + Playwright (`tests/e2e/*`, a11y, theme) |
| Analytics | `@vercel/analytics` |

## 2. Existing admin surface

### Admin pages (`app/admin/*`)
Dashboard, Products (list/new/edit/detail/delete), Categories, Collections, Orders
(list/detail/export route), Inventory, Newsletter, Concierge V2, Customers, Users.

**Admin sidebar** (`components/admin/admin-sidebar.tsx`) only links: Dashboard, Products,
Categories, Collections, Orders, Inventory, Newsletter, Concierge V2. → **Customers and Users
pages exist but are NOT in the nav** (orphaned/undiscoverable).

### Admin APIs
- `app/api/admin/*`: categories, newsletter (campaigns + subscribers), notifications,
  products, scent-story generator, search.
- `app/api/v1/admin/*` (rich backend-upgrade surface): ai-cost, approvals, audit,
  copilot (insights/inventory/margin/marketing), daily-brief, feature-flags,
  integration-events (+reprocess), inventory, jobs (+reprocess), loyalty, products/sync,
  referrals, reviews (moderation), sample-credits, status.
- `app/api/v2/concierge/*`: conversations, chat, messages/feedback, allowance.

### Governance primitives already in the schema (strong foundation)
- `AuditLog` (actor, action, targetType/Id, metadata, createdAt) — **usable now**.
- `ApprovalRequest` (action, riskLevel, status, payload) — approval-gated actions.
- `FeatureFlag` — server feature toggles (API exists; **no admin UI page**).
- `PublishStatus` enum (`DRAFT`/`PUBLISHED`/`ARCHIVED`) — already used by Product.
- `JobRun`, `IntegrationEvent`, `WebhookReceipt`, `IdempotencyKey` — ops plumbing.

## 3. Content-source findings (public → source of truth)

### HARD-CODED business content (Level 1 gaps — no DB, no admin)
| Area | File | Notes |
| --- | --- | --- |
| **Journal / storytelling** | `lib/journal-articles.ts` | Flagship gap. Static array of ~9 articles. `heroImage` all `/placeholder-flacon.svg`. Article bodies rendered from static data. No `Journal`/`Story` model in schema. Public routes `/journal`, `/journal/[slug]` read the array directly. `relatedProductSlugs` is a static string array, not a DB relation. |
| **Primary/secondary navigation** | `components/layout/header.tsx` | `primaryNav` / `secondaryNav` const arrays. |
| **Footer navigation + text** | `components/layout/footer.tsx` | Hard-coded links/columns/copyright. |
| **Announcement bar** | `components/layout/announcement-bar.tsx` | Hard-coded content + visibility. |
| **Homepage section copy** | `app/page.tsx` + `components/home/*` (`PermanentHeroSection`, `FeaturedProductsSection`, `FragranceFamilies`, `BrandStorySection`, `ConciergeInvitation`) | Featured **products** are DB-driven (`isFeatured`+`PUBLISHED`), but every heading/subhead/CTA label/order/visibility is hard-coded in components. Hero fusion fragrance gated by `lib/hero/fusion-config.ts`. |
| **Static pages** | `app/about`, `app/faq`, `app/help/*`, `app/privacy`, `app/terms` | Copy hard-coded in components; no `Page` model. |
| **Global brand settings** | scattered | No `SiteSetting` model. Site name, contact email/phone, socials, SEO defaults, OG image live in code/metadata. |

### CONNECTED (admin edits already reach the public site)
Products, product media/variants/pricing, categories, collections, coupons (via checkout),
orders/fulfilment, inventory, newsletter campaigns/subscribers, reviews (moderation via v1),
feature flags (API only), concierge knowledge/config.

### PARTIALLY connected
- **Reviews**: moderation API + admin exists (`api/v1/admin/reviews`), but no admin **page** in
  the sidebar; public submission via `/api/reviews`.
- **Feature flags**: `FeatureFlag` model + API exist; **no admin UI**. Homepage/hero read
  `lib/config/feature-flags.ts`.
- **Customers / Users**: pages exist, not linked in nav.

## 4. Data-model gaps (no model exists today)
`Journal`/`Story` + `StoryBlock` + story↔product/collection joins · `SiteSetting` (typed) ·
`NavigationMenu` + `NavItem` · `HomepageSection` · `Page` (editorial/static) ·
`MediaAsset` (general library) · `Campaign`/`Promotion` · `Redirect` · `SeoMeta`
(or per-entity SEO fields) · `FormSubmission` (contact/enquiry persistence) ·
`EmailTemplate` (transactional template overrides) · granular RBAC (`Role` is binary).

## 5. Security findings
- ✅ Server-side admin enforcement is centralised (`requireAdmin`/`getAdminUser`) and used by
  `app/admin/layout.tsx` and admin APIs — good, not just hidden buttons.
- ✅ `AuditLog` + `ApprovalRequest` primitives exist.
- ⚠️ **Binary RBAC only** — no Content/Product/Order/Marketing manager separation. Every admin
  is effectively super-admin. Spec §19 wants granular roles.
- ⚠️ **No general media upload pipeline** → when built, must add server-side MIME sniffing,
  size limits, unique filenames (do not trust browser MIME).
- ⚠️ **No rich-text sanitisation layer** yet (needed before any story/page block editor stores
  HTML) — spec §6 requires sanitisation.
- ⚠️ Known pre-existing (from project memory, unrelated to this initiative): no CSRF tokens on
  some mutating routes, no auth rate-limiting, no stock reservation during checkout.
- ⚠️ Project memory: **live DB has broken product images**, and the backend-upgrade migration
  is authored but **NOT applied to the live DB** — any migration here is additive and must be
  **explicitly approved before running against production**.

## 6. Technical debt relevant to this work
- Multiple hard-coded content arrays duplicate what should be DB-owned (`journal-articles.ts`,
  nav consts, homepage copy) → risk of silent divergence.
- Orphaned admin pages (Customers, Users) not in nav.
- Feature-flag system has a backend but no cockpit.
- No caching/revalidation strategy documented for admin→public content propagation (pages are a
  mix of static + dynamic); revalidation hooks must be added per content type as CMS lands.

## 7. Priorities implied by the audit (feeding TODO)
1. **Journal/Storytelling CMS** (flagship, entirely hard-coded) — Phase 2 lead.
2. **Global site settings** (typed) — unblocks header/footer/SEO defaults.
3. **Navigation management** — header + footer + announcement bar.
4. **Homepage section management** — structured sections, not a generic page builder.
5. **Media library** — prerequisite for stories/homepage imagery + fixing broken images.
6. **Feature-flag admin UI** — backend already exists; cheap win.
7. **Granular RBAC + surface existing AuditLog in an admin page.**
8. Editorial/static **Page** management, SEO, redirects, campaigns, form persistence.

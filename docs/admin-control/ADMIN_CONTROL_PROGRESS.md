# ADMIN CONTROL PROGRESS — 9CH / Fádé

## Phase 0 — Repository audit & mapping ✅ (2026-07-18)

**Completed**
- Full repository inspection: stack, routing, ORM, auth/authz, storage, testing.
- Mapped 38 public page routes, 20 admin pages, ~85 API routes, 40+ Prisma models.
- Identified content sources: which public elements are DB-backed vs hard-coded.
- Produced the five working documents under `docs/admin-control/`.

**Files added**
- `docs/admin-control/ADMIN_CONTROL_MASTER_SPEC.md`
- `docs/admin-control/ADMIN_CONTROL_AUDIT.md`
- `docs/admin-control/ADMIN_CONTROL_TODO.md`
- `docs/admin-control/ADMIN_CONTENT_COVERAGE_MATRIX.md`
- `docs/admin-control/ADMIN_CONTROL_PROGRESS.md` (this file)

**Database migrations added:** none (audit phase, read-only).

**Verification:** documentation-only phase; no code changed, build unaffected.

**Key findings**
- Strong existing backend: `AuditLog`, `ApprovalRequest`, `FeatureFlag`, `PublishStatus`, and a
  large `api/v1/admin` surface already exist — foundation is good.
- Flagship gap: **Journal/storytelling is 100% hard-coded** (`lib/journal-articles.ts`), no
  model, no admin. Nav, footer, announcement bar, homepage copy, and static pages are also
  hard-coded. No typed `SiteSetting`, `MediaAsset`, `Page`, `NavigationMenu`, or `Campaign`.
- RBAC is binary (`USER`/`ADMIN`); every admin is effectively super-admin.
- Orphaned admin pages: Customers, Users (exist, not in sidebar).

**Remaining risks / constraints**
- **Live DB divergence:** the backend-upgrade migration is authored but NOT applied to
  production, and live product images are known-broken (project memory). Any new migration is
  additive but must be **explicitly approved before running against prod**.
- No general media-upload pipeline yet — must be built securely before block/story imagery.

## Phase 2a — Journal / Story CMS (flagship vertical) ✅ (2026-07-18)

Built the full storytelling module end-to-end, chosen as the flagship because it was 100%
hard-coded. Built against local/dev only per owner decision — **no migration was applied to the
production database.**

**Data model (additive migration authored, NOT applied to prod)**
- `Story`, `StoryBlock`, `StoryProduct` models + `Product.storyLinks` back-relation
  (`prisma/schema.prisma`).
- Migration SQL: `prisma/migrations/20260718120000_story_cms/migration.sql` — `CREATE TABLE IF NOT
  EXISTS` + indexes + FKs, reuses the existing `PublishStatus` enum. Idempotent, non-destructive.
- `prisma generate` run (no DB contact); client types available.

**Files added**
- `lib/stories/types.ts` — block/story typed inputs.
- `lib/stories/util.ts` — slug, URL safety, text/block sanitisation, `isStoryVisible`
  (server-clock publish window), status-transition guard. ASCII-only source.
- `lib/stories/service.ts` — admin CRUD, publish/schedule semantics, soft-delete/restore,
  optimistic concurrency (`expectedUpdatedAt`), audit logging via existing `writeAudit`.
- `lib/stories/queries.ts` — public reads with graceful fallback to the legacy static array.
- `app/api/admin/stories/route.ts`, `app/api/admin/stories/[id]/route.ts`,
  `app/api/admin/stories/[id]/restore/route.ts` — admin API, `getAdminUser()` gated (401s).
- `app/admin/stories/page.tsx` (list + trash), `.../new/page.tsx`, `.../[id]/edit/page.tsx`.
- `components/admin/story-editor.tsx` — block editor (add/reorder/remove, 7 block types),
  cover/mobile/social image fields, related-product multiselect, schedule/unpublish, featured,
  SEO, unsaved-change warning, publish/schedule/draft actions.
- `components/admin/story-row-actions.tsx` — trash/restore/view-live with confirm dialog.
- `components/journal/story-blocks.tsx` — safe block renderer (no `dangerouslySetInnerHTML`).
- `scripts/seed-stories.ts` — backfills `lib/journal-articles.ts` into the CMS (not yet run).
- `tests/stories/util.test.ts` — 16 passing unit tests.

**Files changed**
- `prisma/schema.prisma` (models + back-relation).
- `app/journal/page.tsx`, `app/journal/[slug]/page.tsx` — now read the DB (static fallback).
- `components/admin/admin-sidebar.tsx` — added Journal + Customers links.

**Security**
- All admin routes gated by `getAdminUser()` server-side (401 on failure); admin pages under the
  `requireAdmin()` layout.
- Block content stored as structured plain text; unknown block types, tags, and non-http(s)/
  non-relative URLs rejected on write AND ignored on render. No stored/executable HTML.
- Every mutation writes an `AuditLog` entry (create/update/trash/restore/delete).
- Optimistic concurrency prevents silent overwrite of concurrent edits.

**Verification (this session)**
- `tsc --noEmit`: **0 errors**.
- `eslint` on all new/changed files: **clean**.
- `vitest run tests/stories`: **16/16 pass**.
- `node scripts/check-em-dashes.mjs`: **pass** (436 files).
- `next build`: running at session end — see continuation point.
- NOT yet verified: live create→publish→visible flow (requires the migration on a reachable DB).

## Phase 2b — Global Settings + Navigation ✅ (2026-07-18)

Second content slice. Built local/dev only; **no migration applied to production.**

**Data model (additive migration authored, NOT applied to prod)**
- `SiteSetting` (typed key/value), `NavigationItem` + `NavLocation` enum (6 locations).
- Migration: `prisma/migrations/20260718130000_settings_navigation/migration.sql` — enum + tables +
  index, all `IF NOT EXISTS` / duplicate-safe. `prisma generate` run.

**Settings** — typed registry is the source of truth (`lib/settings/schema.ts`); only registered
keys can be read/written (no open-ended editor). 23 fields across Brand & SEO, Announcement bar,
Social links, Footer, Contact. `lib/settings/service.ts` gives a request-cached `getSiteSettings()`
(defaults overlaid with stored values, DB-failure tolerant) and an audited `updateSettings()` with
per-type validation (url/email/boolean/text). Admin: `/admin/settings` + `components/admin/settings-form.tsx`.

**Navigation** — `lib/navigation/defaults.ts` mirrors the old hard-coded arrays and is the fallback;
`lib/navigation/service.ts` gives cached public `getNavigation()` and an audited `replaceMenu()`
(validates every href to http(s)/relative). Admin: `/admin/navigation` +
`components/admin/navigation-editor.tsx` (per-menu add/edit/reorder/hide/new-tab).

**Wiring (the key architectural piece)** — chrome components (header, footer, announcement bar,
social links) are client components, and 3 pages that render `MainLayout` are client components, so
an async `MainLayout` was not viable. Instead the **root layout** (`app/layout.tsx`, now async)
fetches settings + nav once and provides them via `SiteChromeProvider`
(`components/layout/site-chrome-context.tsx`); the client chrome reads them from context with
built-in fallbacks. Root `generateMetadata()` now derives site name + default SEO title/description
+ OG image from settings. `MainLayout` stayed synchronous.

**Files added**: `lib/settings/{schema,service}.ts`, `lib/navigation/{defaults,service}.ts`,
`app/api/admin/settings/route.ts`, `app/api/admin/navigation/route.ts`,
`app/admin/settings/page.tsx`, `app/admin/navigation/page.tsx`,
`components/admin/settings-form.tsx`, `components/admin/navigation-editor.tsx`,
`components/layout/site-chrome-context.tsx`, `scripts/seed-navigation.ts`,
`tests/settings/settings.test.ts` (10 tests).

**Files changed**: `prisma/schema.prisma`, `app/layout.tsx`, `components/layout/{main-layout,
header,footer,announcement-bar}.tsx`, `components/footer/SocialLinks.tsx`,
`components/admin/admin-sidebar.tsx` (added Navigation + Settings).

**Verification**: `tsc` 0 errors · eslint clean · `vitest` 26/26 (settings 10 + stories 16) ·
em-dash guard pass (447 files) · `next build` exit 0.

## Phase 2c — Homepage section management ✅ (2026-07-19)

Third content slice. Built local/dev only; **no migration applied to production.**

**Design choice:** a fixed **section catalogue** (registry), not a free-form page builder — safer
and preserves the sophisticated hero motion system. Each section component keeps its original rich
markup as the default and only swaps to a plain custom string when the admin overrides a field, so
**the homepage is pixel-identical until edited**. Data-bound parts (featured products, the fixed
fragrance-family list, hero content) stay in code; the module controls order, visibility, and copy.

**Data model (additive migration authored, NOT applied to prod)**
- `HomepageSection` (`type` unique, `position`, `visible`, `config` JSON = overrides only).
- Migration: `prisma/migrations/20260718140000_homepage_sections/migration.sql`. `prisma generate` run.

**Files added**: `lib/homepage/{registry,service}.ts`, `app/api/admin/homepage/route.ts`,
`app/admin/homepage/page.tsx`, `components/admin/homepage-editor.tsx`, `scripts/seed-homepage.ts`,
`tests/homepage/registry.test.ts` (7 tests).

**Files changed**: `prisma/schema.prisma`, `app/page.tsx` (renders sections from the layout),
`components/home/{featured-products-section,fragrance-families,brand-story-section,concierge-invitation}.tsx`
(optional copy props), `components/admin/admin-sidebar.tsx` (added Homepage).

**Registry** (`lib/homepage/registry.ts`) is the source of truth: 5 section types with typed
editable fields + placeholders. `validateSectionConfig` drops unknown keys, strips tags, drops
empty values (revert to default), and rejects unsafe cta links. `saveHomepageLayout` upserts the
whole layout atomically with audit logging.

**Verification**: `tsc` 0 errors · eslint clean · `vitest` 33/33 (homepage 7 + settings 10 +
stories 16) · em-dash guard pass (452 files) · `next build` exit 0.

## Phase 2d — Media library ✅ (2026-07-19)

Fourth slice. Built local/dev only; **no migration applied to production.**

**Storage reality:** no blob/S3/Cloudinary provider is installed and the app targets Vercel
(read-only FS in prod), so real cloud uploads are blocked on an owner-provided storage credential.
Handled honestly: a **provider-abstracted storage layer** (`lib/media/storage.ts`) ships a
local-disk adapter that works in dev / self-hosted (writes under `public/uploads`, served at
`/uploads/...`) and **refuses to run on serverless** (returns 501) so we never fake a persisted
upload. A blob adapter is the documented prod upgrade. A **register-by-URL** path works everywhere
and matches how the app already stores media.

**Security:** `lib/media/validate.ts` sniffs the real type from **magic bytes** (JPEG/PNG/GIF/WebP/
MP4/WebM) — the browser MIME is ignored — with per-kind size limits (10 MB image / 50 MB video)
and slug-safe unique filenames. Uploads are admin-gated; every mutation is audited.

**Usage + delete protection:** `findUsage(url)` scans Product.images (JSON array_contains),
ProductMedia, Story cover/mobile/social, StoryBlock image data (JSON path), and SiteSetting image
values. Deletion is soft and blocked when referenced unless force-deleted (with a confirm dialog).

**Data model (additive migration authored, NOT applied to prod)**
- `MediaAsset` (url unique, kind, alt, caption, mime, size, dimensions, source, soft-delete).
- Migration: `prisma/migrations/20260719120000_media_library/migration.sql`. `prisma generate` run.
  `public/uploads/` added to `.gitignore`.

**Files added**: `lib/media/{validate,storage,service}.ts`, `app/api/admin/media/route.ts`,
`app/api/admin/media/upload/route.ts`, `app/api/admin/media/[id]/route.ts`,
`app/admin/media/page.tsx`, `components/admin/media-library.tsx`, `scripts/seed-media.ts`,
`tests/media/validate.test.ts` (14 tests). **Changed**: `prisma/schema.prisma`, `.gitignore`,
`components/admin/admin-sidebar.tsx` (added Media).

**Verification**: `tsc` 0 errors · eslint clean · `vitest` 47/47 (media 14 + homepage 7 +
settings 10 + stories 16) · em-dash guard pass (460 files) · `next build` exit 0.

## Phase 5a — Granular RBAC ✅ (2026-07-19)

Fifth slice. Built local/dev only; **no migration applied to production.** Backwards compatible:
every current admin keeps full access (a NULL `adminRole` on an ADMIN user resolves to SUPER_ADMIN).

**Roles + capabilities** — `AdminRole` enum (Super Admin, Content/Product/Order/Marketing Manager,
Analyst) on User. `lib/authz-core.ts` (pure, unit-tested) defines 12 capabilities, the role→
capability map, `resolveRole`, `hasCapability`, and `capabilityForPath`. `lib/authz.ts` adds the
server guards `getAuthorizedUser(cap)` (API → 401/403) and `requireCapability(cap)` (page).

**Enforcement (server-side, not button-hiding)** — a new `middleware.ts` exposes the request path
via `x-pathname`; the admin **layout** reads it and enforces `capabilityForPath(pathname)` for
**every** admin page in one choke point (existing + new). All 9 new-module API route files (18
handlers) now gate on their capability. The sidebar filters links by the viewer's capabilities and
the header shows their role.

**Role management** — `/admin/users` now shows an admin-role selector per user
(`components/admin/user-role-select.tsx`) backed by `PATCH /api/admin/users/[id]/role`
(`users:manage`-gated, audited, self-change blocked). "No admin access" sets role=USER; any
AdminRole grants ADMIN + that role.

**Data model (additive migration authored, NOT applied to prod)**
- `AdminRole` enum + nullable `User.adminRole`.
- Migration: `prisma/migrations/20260719130000_admin_roles/migration.sql` (enum + `ADD COLUMN IF
  NOT EXISTS`). `prisma generate` run.

**Files added**: `lib/authz-core.ts`, `lib/authz.ts`, `middleware.ts`,
`app/api/admin/users/[id]/role/route.ts`, `components/admin/user-role-select.tsx`,
`tests/authz/authz.test.ts` (12 tests). **Changed**: `prisma/schema.prisma`, `lib/admin.ts`
(selects `adminRole`), `app/admin/layout.tsx` (capability enforcement + pass caps/role label),
`components/admin/admin-sidebar.tsx` (+Users&roles, capability filtering),
`components/admin/admin-header.tsx` (role badge), `app/admin/users/page.tsx`, and the 9 new-module
API route files.

**Known residual (documented, not a live gap):** existing `app/api/admin/*` and `app/api/v1/admin/*`
routes still use the coarse ADMIN gate, not capabilities. There is no live exposure because all
current admins are Super Admin; the page-level layout guard already stops a delegated role from
reaching those sections' UIs. Extending per-capability guards to those API handlers is the next
governance task.

**Verification**: `tsc` 0 errors · eslint clean · `vitest` 59/59 (authz 12 + media 14 + homepage 7
+ settings 10 + stories 16) · em-dash guard pass (464 files) · `next build` exit 0 (middleware
compiled + registered).

## Phase 5b — Capability guards on existing admin APIs ✅ (2026-07-19)

Closed the Phase 5a residual. Every existing admin API route now enforces a capability, not just the
coarse ADMIN gate — so a delegated role (e.g. Product Manager) is blocked from orders/marketing/
settings endpoints even via direct API calls.

**Coverage (30 routes)**
- `app/api/admin/*` (8 routes, were `requireAdmin()` → now `getAuthorizedUser(cap)` with clean
  401/403 instead of the old redirect-caught-as-500): categories(+[id]) products:manage; newsletter
  campaigns(+[id]) + subscribers marketing:manage; notifications + search dashboard:view; products/[id]
  products:manage.
- `app/api/v1/admin/*` (22 routes, `getAdminUser()`+`raise('FORBIDDEN')` → added
  `hasCapability(resolveRole(admin), cap)` check): audit→audit:view; feature-flags/jobs/integration-
  events settings:manage; inventory/products-sync/copilot-inventory/copilot-margin products:manage;
  loyalty/referrals/sample-credits/copilot-marketing marketing:manage; reviews(+[id]) content:manage;
  approvals(+[id]) orders:manage; ai-cost/daily-brief/copilot-insights/status dashboard:view.
- Individually: `app/api/admin/scent-story` products:manage; `app/admin/orders/export` orders:view.

**Verification**: `tsc` 0 errors · eslint clean · full `vitest` **371/371** (47 files — no
regressions) · em-dash guard pass (464 files) · `next build` exit 0.

RBAC is now complete: pages (layout choke point) AND all admin APIs enforce capabilities server-side.

## Phase 2e — Audit-log + Feature-flag cockpits ✅ (2026-07-20)

Read/observability slice. Built local/dev; **no migration** (`AuditLog` and `FeatureFlag` predate the
initiative and already exist in the live schema, so nothing to apply).

**Audit-log viewer** — `/admin/audit`, gated `audit:view` via the layout choke point (path→capability
rule added). Server component reads `prisma.auditLog` directly with a native GET filter form
(action contains / target-type / target-id / actor-id), paginated 50/page, newest first. Read-only:
no create/edit/delete surface, matching the append-only model. Graceful load-error card if the table
is absent.

**Feature-flag cockpit** — `/admin/feature-flags`, gated `settings:manage`. **Read-only by explicit
owner decision** (this session): the resolver is env-driven (`FEATURE_FLAGS`), so a DB toggle would
be a fake button, and the financial (`loyalty_/referral_/sample_credits`) + approval-gated hero flags
must stay owner-controlled. The page lists every flag grouped by area with effective state, built-in
default, and source (env override vs default); owner-controlled flags are badged. Persisted
`FeatureFlag` rows, if any, are shown as "not consulted by the resolver" for transparency.

**Files added**: `lib/audit/filters.ts` (pure: `buildAuditWhere`/`parsePage`/`pageSkip`/`pageCount`),
`lib/config/feature-flag-meta.ts` (pure flag labels/groups/owner-controlled map),
`app/admin/audit/page.tsx`, `app/admin/feature-flags/page.tsx`, `tests/audit/filters.test.ts` (8),
`tests/config/feature-flag-meta.test.ts` (7).
**Files changed**: `lib/config/feature-flags.ts` (+`flagKeys`/`flagDefault`/`flagSource`),
`lib/authz-core.ts` (+`/admin/audit`→`audit:view`, `/admin/feature-flags`→`settings:manage`),
`components/admin/admin-sidebar.tsx` (+Feature flags, +Audit log).

**Verification**: `tsc` 0 errors · eslint clean · full `vitest` **386/386** (49 files, +15 new, no
regressions) · em-dash guard pass (468 files) · `next build` (running at write time — see below).

## Phase 2f — Reviews moderation admin ✅ (2026-07-20)

Thin UI over an existing backend; **no migration** (`Review` + `ModerationStatus` predate the
initiative). Page `/admin/reviews`, gated `content:manage` via the layout choke point (path rule
added). Status tabs (Pending/Approved/Rejected) with live counts from a `groupBy`; the queue orders
`reportedCount desc, createdAt desc` so reported reviews surface first. Each row shows a star rating,
verified-purchase + reported badges, the comment, product link, and reviewer. Approve/Reject buttons
(client component) POST to the existing `POST /api/v1/admin/reviews/[id]`, which flips
`moderationStatus`/`approved`, stamps `moderatedBy/At`, and writes an audit entry. No "spam" action:
the backend models only approve/reject, and `reportedCount` is surfaced rather than faking a button.

**Files added**: `lib/reviews/moderation.ts` (pure: `normaliseStatus`/`availableDecisions`/tabs),
`app/admin/reviews/page.tsx`, `components/admin/review-moderation-actions.tsx`,
`tests/reviews/moderation.test.ts` (5). **Changed**: `lib/authz-core.ts`
(+`/admin/reviews`→`content:manage`), `components/admin/admin-sidebar.tsx` (+Reviews).

**Verification**: `tsc` 0 errors · eslint clean · `vitest` reviews 5/5 (full suite green) ·
em-dash guard pass · `next build` (see below).

## Phase 2g - Static Pages CMS + Forms enquiries inbox (2026-07-20)

Two additive migrations were authored and **not applied to production**:
`20260720190000_static_pages_cms` adds `Page` + `PageBlock`; `20260720191000_form_submissions`
adds `FormSubmission` + its status enum.

**Pages CMS:** `/admin/pages` (`content:manage`) provides create/edit, structured safe blocks,
SEO fields, publish windows, optimistic concurrency, trash/restore, and audited mutations. About,
FAQ, and help routes query published managed pages and fall back to their existing static output
when the table/record is absent. `scripts/seed-pages.ts` safely materialises six current routes.

**Enquiries:** the contact API persists validated submissions before sending email. The
`/admin/enquiries` inbox uses the new `support:manage` capability (Super Admin + Order Manager),
with search, status triage, private notes, spam, audited updates, and formula-safe CSV export. A
temporary P2021-only fallback preserves the existing email path until the production migration is
approved; other persistence failures return 503 instead of claiming success.

**Governance:** `.github/pull_request_template.md` now includes the future-feature-parity rule.

**Verification:** Prisma schema/generation pass; full TypeScript check has 0 errors; targeted eslint
clean; new page/forms unit tests 5/5; full non-DB suite 394 tests passed with the existing DB-backed
review suite unable to connect; em-dash guard and production build pass. DB E2E is still blocked.

## CONTINUATION POINT

Current phase: **Phase 2a-2g + 5a + 5b code-complete; DB-dependent E2E pending.**
Last completed task: Pages CMS (§2.2) + enquiries inbox (§2.3). Coverage matrix Connected 26 /
Partially connected 2 / Hard-coded 0 / Missing 0. Typecheck/lint/em-dash/build are green.

Next up: the verification gate remains blocked on a reachable dev database. After that, scheduled
publishing (§3.1) and the media picker (§3.2) are the highest-value fix-ups.

**→ The full remaining backlog now lives in [`ADMIN_CONTROL_REMAINING.md`](./ADMIN_CONTROL_REMAINING.md)**
(blockers, verification gate, remaining modules with priority/effort, known limitations, and a
recommended order). Keep that file current as work proceeds.

Immediate next steps:
1. **Verification gate** - apply the 7 migrations to a **dev** DB (`prisma migrate deploy`), run the
   5 content seeds, and E2E-verify the shipped modules (see REMAINING §1).
2. **Scheduled publishing + media picker** (REMAINING §3.1-3.2).

Known blocker: **Owner go-ahead required to apply migrations to the production database** (and a blob
credential for prod uploads). Every prod-facing surface degrades to built-in defaults/static content
until migrations + seeds run, so the storefront is safe to deploy as-is.

## Phase 2h - Publishing, media integration, and growth controls (2026-07-20)

Added the scheduled story/page publisher with both a protected cron endpoint and an authorized
manual endpoint. `vercel.json` originally invoked it every five minutes; deployment requires
`CRON_SECRET`.
The job records `JobRun` state and audit history. Added the shared media picker to story/page image
fields and image-valued site settings.

Authored the additive `20260720210000_growth_content_controls` migration. It adds campaigns and
campaign products, redirects, content revisions, product relations, transactional email templates,
customer tags/notes/segment/status, and product/collection SEO and catalogue fields. It has not been
applied to any database.

New admin surfaces: `/admin/campaigns`, `/admin/redirects`, `/admin/email-templates`; customer
management now reads real users/orders and persists audited tags, notes, and segments. Story/page
edits snapshot revisions and support audited restoration. Runtime redirects are resolved by the
required catch-all route. Product and collection editors now cover the added SEO and catalogue
fields. Receipt, order-status, and price-drop mailers consume safe fixed-key template overrides and
fall back to their code templates.

Verification: Prisma generate and validate pass; TypeScript and ESLint pass; 397/397 non-DB tests
pass across 53 files; the em-dash guard passes across 514 files; the Next.js production build exits
0 and emits all new routes. DB E2E remains blocked on a reachable dev database.

## CURRENT CONTINUATION POINT

The admin-control coverage pass is complete at MVP depth: Connected 28 / Partially connected 0 /
Hard-coded 0 / Missing 0, excluding intentionally static legal pages. Nine initiative migrations
are authored and unapplied in production. The local DB verification gate is complete. Remaining
work is production migration approval, a connected Blob store, and the optional depth items in
`ADMIN_CONTROL_REMAINING.md`.

## Phase 2i - Verification gate and production upload adapter (2026-07-20)

Implemented Vercel Blob storage in `lib/media/storage.ts`; a configured
`BLOB_READ_WRITE_TOKEN` automatically selects Blob while local/self-hosted development retains the
disk adapter. `MEDIA_STORAGE=blob|local` provides an explicit override. Added five adapter-selection
tests and installed `@vercel/blob`. The linked Vercel project currently exposes no environment
variables, so a real Blob write still needs the owner to create/connect the store.

The complete migration chain was applied to a fresh isolated PostgreSQL 16 container. Verification
found historical Prisma drift in User/Order fields; additive migration
`20260720220000_schema_reconciliation` now closes it. All 15 migrations apply from zero and
`prisma migrate diff` reports no difference. All five content seeds ran successfully.

Added DB integration coverage for revisions, scheduled publish/archive, enquiries, campaigns,
redirects, email overrides, and audits. Browser verification covered seeded public routes, runtime
redirects, disposable Super Admin sign-in/navigation, and `/admin/media`. The redirect route was
corrected from `[[...path]]` to `[...path]` after live dev verification exposed a homepage
specificity conflict.

Final verification: TypeScript pass, ESLint pass, em-dash guard pass, 406/406 tests across 56 files
including four DB integration tests, production build pass, and zero Prisma schema drift. No
production database migration, seed, or Blob write was performed.

## Phase 2j - Production prerequisites and role verification (2026-07-20)

Read-only production inspection confirmed that the six historical migrations are recorded and the
nine initiative migrations remain pending. No production database mutation was made because each
migration still requires explicit owner approval.

Created and connected the `9thluxe-media` Vercel Blob store to production, preview, and development.
The injected Blob credential completed a real upload/delete round trip. Added a cryptographically
random sensitive `CRON_SECRET` to production; deployed cron invocation and clock-boundary proof wait
for the current application code and schema to be deployed.

Browser verification used disposable Content Manager, Marketing Manager, and Analyst accounts on a
fresh isolated PostgreSQL database. Each role saw only its authorized sidebar entries; forbidden
admin pages redirected with `error=forbidden`; forbidden APIs returned 403; and permitted content,
campaign, and audit surfaces remained accessible. The verification server, users, and database were
removed afterward.

## Phase 2k - Production database rollout (2026-07-20)

After explicit per-migration and per-seed owner approval, applied all nine pending initiative
migrations to production. Prisma reports all 15 repository migrations applied. Ran the five
approved idempotent seeds successfully: 5 stories, 22 navigation items, 5 homepage sections, 3
media assets, and 6 pages. Direct production counts confirmed those results, and storefront smoke
checks returned 200 for `/`, `/journal`, `/about`, `/faq`, and `/help`.

The application release was rejected before deployment because the linked Vercel Hobby plan allows
daily cron jobs only, while `vercel.json` specifies `*/5 * * * *`. The owner must choose between a
Pro upgrade retaining five-minute publishing or a daily Hobby-compatible schedule before deployed
cron verification can finish. The failed deployment did not alter the live release.

The owner selected the Hobby-compatible option. `vercel.json` now schedules publishing daily at
00:00 UTC.

## Phase 2l - Production deployment and cron proof (2026-07-20)

Deployed the complete admin-control implementation to production with the Hobby-compatible daily
publishing schedule. The production build compiled successfully, passed TypeScript, generated all
71 static pages, deployed its serverless routes, and moved the canonical alias to the new release.

Rotated `CRON_SECRET` without printing or persisting it locally. The deployed cron endpoint returned
401 without authorization and `ok: true` with the secret. Its publishing result found no records due
for transition, and production persisted the corresponding `scheduled-publishing` `JobRun` as
`SUCCEEDED` with no error. Live smoke checks returned 200 for the storefront, journal, managed static
pages, health endpoint, and sign-in surface. The first automatic 00:00 UTC invocation remains to be
observed after that clock boundary.

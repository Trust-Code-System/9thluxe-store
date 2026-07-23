# ADMIN CONTROL MASTER SPEC — 9CH / Fádé

## Objective
Give the Fádé admin panel near-complete **admin-to-website control coverage**: every
business-controlled element on the public storefront has an appropriate management interface,
without exposing source, secrets, infra, or auth internals. Extend and repair the existing
system; do not rebuild what works.

## Current architecture (summary)
Next.js 16 App Router + React 19, Prisma/PostgreSQL, NextAuth 5 (credentials), Tailwind, Radix,
Paystack, Resend. Server-side admin gate in `lib/admin.ts`. Existing governance primitives:
`AuditLog`, `ApprovalRequest`, `FeatureFlag`, `PublishStatus`. Full inventory in
[`ADMIN_CONTROL_AUDIT.md`](./ADMIN_CONTROL_AUDIT.md).

## Admin architecture decisions
1. **Extend, don't replace.** Reuse `app/admin/*` layout, `requireAdmin`/`getAdminUser`,
   existing Radix form/table components, and the `api/admin` + `api/v1/admin` conventions.
2. **Structured sections over a generic page builder.** Homepage and editorial pages use typed
   section/block models (constrained, safe, migratable) — not free-form HTML.
3. **One source of truth per element.** Migrate hard-coded arrays (`journal-articles.ts`, nav
   consts, homepage copy) into DB models; keep the static array only as a seed/fallback until
   the DB is populated, then remove.
4. **Additive migrations only.** No editing of already-applied migrations. New migrations are
   authored locally and **applied to production only with explicit owner approval** (live DB
   currently diverges — see audit §5).
5. **Server-enforced authorization for every mutation.** Never rely on hidden buttons.

## Content-management model
- Content types get a `status` (`DRAFT`/`PUBLISHED`/`ARCHIVED`, reusing `PublishStatus`),
  `publishedAt`/`scheduledFor`/`unpublishAt`, `updatedAt` (optimistic concurrency), slug, SEO
  fields, and (where editorial) an ordered list of typed **blocks**.
- Relationships are real DB relations / join tables (story↔product, story↔collection,
  homepage-section↔content), never hard-coded slug arrays.

## Publishing model
Draft → (In review, where relevant) → Scheduled → Published → Unpublished → Archived.
Public queries filter to `PUBLISHED` **and** `publishedAt <= now()` **and**
(`unpublishAt is null` or `> now()`), evaluated against a server clock. Scheduled transitions
run via a job (reuse `JobRun`) or on-read evaluation. Preview uses authenticated/expiring links.

## Permission model
Introduce granular roles layered over the existing binary `Role`: Super Admin, Content Manager,
Product Manager, Order Manager, Marketing Manager, Analyst/Viewer, with per-capability grants
(view/create/edit/delete/publish/archive/restore/export/refund/manage-settings/manage-users).
Enforced in a shared `authorize(user, capability)` server helper used by every admin action.
Backwards-compatible: existing `ADMIN` = Super Admin until roles are assigned.

## Audit-log model
Reuse `AuditLog`. Every create/update/publish/unpublish/archive/restore/delete/settings-change/
role-change/refund writes an entry (actor, action, targetType/Id, before/after summary). Never
log secrets or full customer PII. Surface via a new read-only admin audit page.

## Media-management model
New `MediaAsset` (url, kind, alt, caption, width/height, focal point, ownerRef, usage count).
Upload endpoint validates by server-side content sniffing + size limit + unique filename;
storage via the existing/blob provider. Referenced assets are protected from deletion.

## Data-migration strategy
Additive columns/tables with explicit defaults + backfill from existing hard-coded arrays via
seed scripts. Deterministic migration order. Rollback notes per migration. Nothing destructive.

## Testing strategy
Vitest for schema/validation/permission/status-transition/slug/sanitisation logic; Playwright
for admin→public flows (create story → publish → visible; draft not visible; archived hidden;
unauthorized blocked). Reuse existing `tests/e2e/*` harness.

## Completion criteria
See [Definition of Done in the initiative brief]. In short: no unexplained `Missing`/`Broken`/
`Partially connected` rows in the coverage matrix; lint + typecheck + tests + build pass;
critical admin→public flows verified.

## Future feature parity rule
> No new public-facing feature is complete until its data model, admin interface, server-side
> validation + authorization, frontend rendering, preview, publication state, error handling,
> audit logging, tests, and coverage-matrix row are implemented and verified.
Add to PR template / contributor docs.

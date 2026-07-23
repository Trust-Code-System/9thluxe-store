# Continuation prompt — paste into a new session

Copy everything in the block below into a fresh session to continue the admin-control initiative.

---

You are a senior full-stack + CMS + security engineer continuing an in-progress initiative in the
existing **9CH / Fádé** codebase (project name is "9CH" — the number 9 + "CH"; the storefront brand
is "Fádé"/"Fádé Essence"). Preserve the canonical naming already in the repo; do not rename things.

## Working directory & stack
- Repo root: `c:\Users\Admin\Desktop\9thluxe-store-starter` (Windows; shell is PowerShell primary,
  Bash also available).
- Next.js 16 App Router + React 19 + TypeScript · Prisma 6 / PostgreSQL · NextAuth 5 (credentials) ·
  Tailwind + Radix UI · Paystack · Resend · Vitest + Playwright.
- DB: `DATABASE_URL` points at `db.prisma.io` (Prisma-hosted Postgres = **production**). There is NO
  local Postgres and NO middleware role in the JWT.

## The initiative
Give the Fádé admin panel near-complete **admin-to-website control coverage**: every
business-editable public element has an appropriate admin interface, without exposing source,
secrets, infra, or auth internals. Extend/repair the existing system; don't rebuild what works.

## READ THESE FIRST (the source of truth — always read + keep current)
- `docs/admin-control/ADMIN_CONTROL_REMAINING.md` — **the forward plan**: blockers, verification
  gate, remaining modules (priority/effort), known limitations, recommended order.
- `docs/admin-control/ADMIN_CONTROL_PROGRESS.md` — what's done + the CONTINUATION POINT.
- `docs/admin-control/ADMIN_CONTENT_COVERAGE_MATRIX.md` — public route → admin control status.
- `docs/admin-control/ADMIN_CONTROL_MASTER_SPEC.md`, `ADMIN_CONTROL_AUDIT.md`,
  `ADMIN_CONTROL_TODO.md` — decisions, original audit, phase checklist.

## Standing owner decisions (do not violate)
1. **Local/dev only.** Do NOT apply any migration to the production database. Author additive
   migration SQL by hand under `prisma/migrations/<timestamp>_<name>/migration.sql` (use
   `CREATE TABLE/TYPE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$…duplicate_object…$$` for
   enums). Run only `npx prisma generate` (no DB contact). Applying to prod needs explicit per-
   migration approval.
2. **Depth over breadth.** Build one module fully (model → service → API → admin UI → public wiring
   → tests → docs) before starting the next.
3. Every public surface must **degrade gracefully** to built-in defaults/static content so the
   storefront is safe to deploy before migrations run.

## What is already SHIPPED & verified (do not redo)
Journal/Story CMS · Global Settings · Navigation · Homepage sections · Media library · Granular
RBAC · Audit viewer · Feature flags · Reviews · Pages CMS · Enquiries · Scheduled publishing ·
Media picker · Campaigns/coupons · SEO/redirects · Revisions · Product/customer depth · Email
templates · Vercel Blob adapter. Nine initiative migrations are authored and **none is applied to
production**. The complete 15-migration chain and five seeds pass on isolated PostgreSQL 16.

## Established patterns to COPY for any new module
- **Auth (APIs):** `const authz = await getAuthorizedUser("<capability>")` from `@/lib/authz`;
  `if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })`; then `const admin = authz.user`.
- **Auth (pages):** rely on `app/admin/layout.tsx` (enforces `capabilityForPath(pathname)` via the
  `x-pathname` header set by `middleware.ts`). For a new admin section, add its path→capability rule
  in `lib/authz-core.ts` `capabilityForPath()` and a nav item (with `capability`) in
  `components/admin/admin-sidebar.tsx`.
- **Capabilities** live in `lib/authz-core.ts` (pure, unit-tested — import from here in tests/edge);
  server guards in `lib/authz.ts`. Roles: SUPER_ADMIN, CONTENT_MANAGER, PRODUCT_MANAGER,
  ORDER_MANAGER, MARKETING_MANAGER, ANALYST (a NULL `adminRole` on an ADMIN user = SUPER_ADMIN).
- **Audit:** every mutation calls `writeAudit({ actorId, actorRole, action, targetType, targetId, metadata })` from `@/lib/audit`.
- **Typed config, not open key/value.** Settings/homepage use a fixed registry
  (`lib/settings/schema.ts`, `lib/homepage/registry.ts`) that validates + drops unknown keys.
- **Public reads:** `cache()`-wrapped, merge stored values over defaults, wrapped in try/catch that
  falls back to defaults/static when the table/DB is unavailable.
- **Publish model:** reuse the `PublishStatus` enum + `isStoryVisible`-style server-clock checks.
- **Content sanitisation:** structured blocks + plain text (no stored HTML); validate URLs to
  http(s)/relative; sniff uploads by magic bytes (never trust browser MIME) — see `lib/media/*`.
- **Client chrome** (header/footer/announcement) reads server data via `SiteChromeProvider`
  (`components/layout/site-chrome-context.tsx`), populated once in the async root `app/layout.tsx`.

## Hard rules
- **Em dash (U+2014) is BANNED** in `app/`, `components/`, `emails/`, `lib/` — the prebuild guard
  `node scripts/check-em-dashes.mjs` fails on it. Use `·`, `:`, or a hyphen. (En dash U+2013 is OK.)
- Source files stay **ASCII** where practical; avoid literal control/zero-width chars in regexes.
- No fake buttons, no forms that don't persist, no success without DB confirmation, no exposing
  controls the public site doesn't consume.

## Verification bar (must all pass before claiming a module done)
```
npx tsc --noEmit            # 0 errors
npx eslint <changed paths>  # clean
npx vitest run <suites>     # your new tests + no regressions
node scripts/check-em-dashes.mjs
npx next build              # exit 0 (slow ~5min; run in background)
```
The complete suite is currently 406/406 across 56 files when `DATABASE_URL` targets a migrated test
database. Add unit tests for new pure logic
(`tests/<area>/*.test.ts`, import pure helpers, not server modules).

## Do next (from ADMIN_CONTROL_REMAINING.md — confirm order with me if unsure)
1. Create/connect a Vercel Blob store, confirm `BLOB_READ_WRITE_TOKEN` is injected, and live-test
   an authenticated upload. The adapter and local selection tests already pass.
2. Obtain explicit per-migration production approval before running any of the nine initiative
   migrations. Configure `CRON_SECRET` and verify publishing across a deployed time boundary.
3. Review the optional depth/polish list in `ADMIN_CONTROL_REMAINING.md` with the owner before
   starting another implementation batch.

## Known limitations to be aware of (see REMAINING §3)
- Production uploads need an owner-provided blob credential; local-disk adapter is dev/self-hosted
  only; register-by-URL works everywhere.
- Campaign/customer/product/email modules are connected at MVP depth; richer edit, bulk, relation,
  preview, and test-send workflows remain optional follow-up work.

## Working style
Update the `docs/admin-control/*` files (especially REMAINING + PROGRESS + the coverage matrix) as
you go. Keep the repo deployable after each module. Report honestly — if a step is skipped or a test
fails, say so with evidence. For anything outward-facing, spending money, or applying migrations to
prod: analyze → recommend → wait for explicit approval.

Start by reading the docs above, then tell me your plan for the next module before building.

---

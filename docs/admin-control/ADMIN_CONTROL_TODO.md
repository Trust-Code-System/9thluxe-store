# ADMIN CONTROL TODO — 9CH / Fádé

Marked complete only when **implemented AND verified** (not merely coded).

> **What's left, prioritised:** see [`ADMIN_CONTROL_REMAINING.md`](./ADMIN_CONTROL_REMAINING.md) —
> the consolidated backlog (blockers, verification gate, remaining modules, known limitations).
> This checklist is the phase-by-phase record; REMAINING is the forward-looking plan.

## Phase 0: Repository audit & mapping
- [x] Inspect stack, routing, ORM, auth, storage
- [x] Map public routes
- [x] Map admin routes + APIs
- [x] Map data models
- [x] Identify hard-coded content
- [x] Identify missing / partial / orphaned admin controls
- [x] Security & RBAC review
- [x] Write MASTER_SPEC, AUDIT, TODO, PROGRESS, COVERAGE_MATRIX

## Phase 1: Shared admin foundation
- [x] `authorize(user, capability)` server helper + granular role map (backwards-compatible)
- [x] `writeAuditLog()` helper wrapping `AuditLog`
- [x] Shared publish-state utilities (isVisible(now), scheduling filter)
- [x] Shared slug + content-sanitisation utilities (+ unit tests)
- [x] Add orphaned pages (Customers, Users) + new sections to admin sidebar
- [x] Feature-flag admin page (read-only by owner decision)
- [x] Audit-log admin read page

## Phase 2: Highest-priority content gaps
- [x] **Journal/Story CMS** — model + migration authored (additive, NOT applied to prod yet)
- [x] Journal admin: list, create, edit, blocks, cover media, related products, draft/publish/schedule/archive, trash/restore, preview link
- [x] Wire `/journal` + `/journal/[slug]` to DB (fallback to static array until seeded)
- [x] Seed script backfilling `lib/journal-articles.ts` into DB (`scripts/seed-stories.ts`, not yet run)
- [x] Sidebar: added Journal + Customers links
- [x] **Apply all 15 repository migrations to an isolated dev DB, run 5 seeds, verify DB/browser flows**
- [x] Global `SiteSetting` (typed registry) model + `/admin/settings` page; wired to header/footer/announcement/SEO
- [x] Navigation manager (header primary/secondary + 4 footer menus) + wired header/footer via SiteChromeProvider
- [x] Homepage section management (structured `HomepageSection` catalogue: order + show/hide + per-section copy); wired `app/page.tsx`
- [x] Media library (`MediaAsset`): upload (magic-byte validated) + register URL + alt/caption + usage scan + delete protection; `/admin/media`
- [x] Static/editorial Pages CMS (`Page` + `PageBlock`) for about/faq/help with safe fallback, SEO, publish state, admin editor, and seed
- [x] Wire a media picker into story/page editors and image-valued settings (homepage registry currently has no image field)
- [x] Production upload storage adapter: Vercel Blob implementation + provider-selection tests
- [x] Create/connect the Vercel Blob store and live-test with `BLOB_READ_WRITE_TOKEN`

## Phase 3: Product & merchandising parity
- [x] Audit product editor field coverage vs spec §7; add catalogue, commerce and SEO gaps
- [ ] Explicit product/media ordering controls
- [ ] Related products / related stories / related collections relations
- [x] Collection image/mobile image + manual member ordering

## Phase 4: Operations
- [x] Persist contact/enquiry submissions (`FormSubmission`) + admin inbox (search/status/notes/spam/export)
- [x] Reviews admin page (surface existing API)
- [x] Discounts/campaigns manager MVP (create/list campaigns and coupons; scheduled public banner)
- [ ] Order fulfilment field coverage review

## Phase 5: Governance
- [x] Granular roles (`AdminRole`) + capability system (`lib/authz`) + role assignment UI (`/admin/users`)
- [x] Server-side enforcement: middleware exposes pathname → admin layout gates EVERY admin page; new-module APIs gate per capability; sidebar filters by capability
- [x] Extend capability guards to existing `app/api/admin/*` + `app/api/v1/admin/*` routes (30 routes now capability-gated with clean 401/403)
- [x] Trash / soft-delete + restore for stories & media (done in their modules)
- [x] Version history / revisions for stories & pages
- [x] Scheduled publish/unpublish job
- [x] Add the future-feature-parity checklist to the PR template

## Phase 6: SEO, search, campaigns
- [x] Per-entity SEO fields (warning dashboard remains optional polish)
- [x] Redirect manager
- [ ] Search/filter configuration
- [x] Campaign management + feature toggles catalogue

## Phase 7: Frontend↔admin parity
- [ ] Remove obsolete hard-coded business content
- [ ] Cache invalidation / revalidation per content type
- [x] Drive coverage matrix to zero unexplained gaps

## Phase 8: Final verification & docs
- [x] lint / typecheck / non-DB tests / build all pass
- [x] Browser verification of critical public/admin flows
- [x] Role-restriction verification
- [x] Update PROGRESS continuation point + final report

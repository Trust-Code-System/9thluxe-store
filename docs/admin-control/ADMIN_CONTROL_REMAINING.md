# ADMIN CONTROL: WHAT'S LEFT

> Living backlog for the admin-to-website control initiative. Last updated: 2026-07-20.

## Snapshot

The requested implementation batch is complete at MVP depth:

- Scheduled publishing and unpublishing for stories and pages.
- Reusable media picker in story/page editors and image settings.
- Campaign and coupon creation, scheduled storefront campaign banner, SEO fields, redirects,
  story/page revisions, expanded product fields, customer tags/notes/segments, and safe
  transactional email overrides.

**Coverage matrix:** Connected 28 · Partially connected 0 · Hard-coded 0 · Missing 0.
Legal pages remain intentionally static and are not counted as an open gap.

## 0. Owner blockers

None for the requested production rollout.

The nine additive initiative migrations were applied to production on 2026-07-20:

1. `20260718120000_story_cms`
2. `20260718130000_settings_navigation`
3. `20260718140000_homepage_sections`
4. `20260719120000_media_library`
5. `20260719130000_admin_roles`
6. `20260720190000_static_pages_cms`
7. `20260720191000_form_submissions`
8. `20260720210000_growth_content_controls`
9. `20260720220000_schema_reconciliation`

## 1. Verification gate completed locally

- [x] Apply the complete 15-migration repository chain to a fresh PostgreSQL 16 database.
- [x] Confirm zero Prisma schema drift after migration.
- [x] Run the five content seeds: stories, navigation, homepage, media, and pages.
- [x] DB-prove revisions, scheduled publishing/unpublishing, enquiries, campaigns, redirects,
  email overrides, review purchase verification, and audit writes.
- [x] Browser-prove seeded public routes, runtime redirects, admin sign-in/navigation, and media.
- [x] Configure production `CRON_SECRET`.
- [x] Deploy and invoke `/api/cron/publishing`. The approved Hobby-compatible schedule runs daily
  at 00:00 UTC; the protected live invocation and production `JobRun` record both succeeded.
- [ ] Confirm Vercel's first automatic invocation after the next 00:00 UTC boundary.
- [ ] Verify scheduled publish/unpublish across the deployment clock boundary.

All checks are green: Prisma validate and zero-drift diff, TypeScript, ESLint, 406 tests including
four DB integration tests, the em-dash guard, and the Next.js production build.

## 2. Optional depth and polish

These are no longer coverage blockers, but remain useful follow-up work:

- Campaigns: edit/delete existing records, richer discount rules, story linking, and explicit
  merchandising of linked products.
- SEO: duplicate-slug and missing-metadata warning dashboard; collection metadata consumption on
  any future canonical collection detail route.
- Products: related-product editing, explicit media ordering, related-story/collection controls,
  and consolidation of the legacy `/admin/products/[id]/edit` screen.
- Customers: status/suspension workflow, saved segments, bulk tagging, and a richer consent view.
- Email templates: rendered preview and authorized test-send flow.
- Media: use the shared picker anywhere a future homepage image field is added. The current
  homepage registry has no image-valued field.
- Content: optional revision comparison and retention policy.
- Admin UX: hide customer mutation controls from read-only analyst sessions.
- Minor statics: footer column labels and the newsletter eyebrow, only if the owner wants them
  editable.
- Order fulfilment field-coverage review: tracking, courier, and returns.

## 3. Deployment notes

- The publishing cron runs daily at 00:00 UTC through `vercel.json` and requires `CRON_SECRET`.
- Production `CRON_SECRET` is configured in the linked Vercel project.
- The current application is deployed to production with the daily cron configuration.
- All 15 repository migrations are applied in production. The five approved content seeds ran
  successfully: stories, navigation, homepage, media, and pages.
- The Vercel Blob adapter is implemented and auto-selected when `BLOB_READ_WRITE_TOKEN` exists.
  The `9thluxe-media` store is connected to all environments, and a production-provider
  upload/delete round trip passed.
- Content Manager, Marketing Manager, and Analyst role restrictions were browser-verified at the
  sidebar, page-route, and API layers against an isolated PostgreSQL database.
- Production storefront smoke checks returned 200 for `/`, `/journal`, `/about`, `/faq`, and `/help`.

## 4. Governance

- [x] Future-feature-parity rule is in `.github/pull_request_template.md`.
- [ ] Add configurable search facets only if the storefront makes them business-editable.

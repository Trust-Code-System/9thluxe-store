# Migration Plan

Controlled migration from the current perfume/watch/glasses schema to the perfume-only upgraded
schema. **No production DB is destructively replaced.** Additive columns/tables + a scoped drop of
non-perfume columns, each with a `rollback.sql`.

## Migration in this branch
`prisma/migrations/20260710000000_backend_upgrade_perfume/`
- `migration.sql` — forward (create enums/tables, add perfume columns, drop
  `material`/`lensType`/`warranty`/`waterResistance`). Generated offline via
  `prisma migrate diff` (schema→schema, no DB needed).
- `rollback.sql` — reverse (restore dropped columns, drop new tables/enums/columns).

## Steps (owner, against a real DB)
1. **Backup** the database (managed provider snapshot / `pg_dump`).
2. **Dry-run:** `npx tsx scripts/migrate/validate.ts` (read-only) to detect issues before applying.
3. **Apply on a clean/staging DB first:** `npx prisma migrate deploy`, then `npx prisma db seed`.
4. **Validate:** re-run `validate.ts`; confirm counts + no non-perfume rows remain.
5. **Reconcile** product media/prices; run contract + unit tests.
6. **Promote** to production during a low-traffic window after a fresh backup.

## Data mapping & cleanup
- **Remove watches/glasses:** columns dropped by the migration; any non-perfume product rows are
  **quarantined and reported** by `validate.ts` (not silently deleted) for owner review.
- **Duplicate detection:** duplicate SKUs flagged (unique constraint on `Product.sku`,
  `ProductVariant.sku`).
- **Unsupported claims:** performance fields are stored as editorial; `authenticityStatus` prevents
  mislabelling retailer inspection as manufacturer verification.
- **Brand cleanup:** `lib/brand-slug-map.ts` retained (all perfume houses).
- **Customers/orders preserved:** additive only; no customer or order data is dropped.
- **No fabricated stats:** nothing is imported from the current website's marketing copy.

## Validation & reconciliation
`scripts/migrate/validate.ts` checks: non-perfume products, duplicate SKUs, invalid currency,
orphaned customer/order records, products missing required attributes. It prints a **migration
report** (counts + issues) and exits non-zero if blocking issues exist.

## Cannot run here
This session has no `DATABASE_URL`, so migrations are authored + validated offline but **not
applied**. All scripts run in read-only/dry-run mode and no-op gracefully without a DB.

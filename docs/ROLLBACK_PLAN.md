# Rollback Plan

Every migration in this upgrade ships a reverse script. Rollback is a documented, tested-offline
procedure — not an afterthought.

## Artifacts
- Forward: `prisma/migrations/20260710000000_backend_upgrade_perfume/migration.sql`
- Reverse: `prisma/migrations/20260710000000_backend_upgrade_perfume/rollback.sql`
  (generated via `prisma migrate diff` new→old; restores dropped Product columns, drops the new
  tables/enums/columns).

## When to roll back
Post-deploy errors that trace to the schema change, or validation/reconciliation failures that can't
be fixed forward quickly.

## Procedure
1. **Stop writes** if feasible (maintenance flag) to avoid new rows in tables about to be dropped.
2. **Backup first** (snapshot) — rollback is itself a schema change.
3. Apply the reverse SQL:
   `psql "$DATABASE_URL" -f prisma/migrations/20260710000000_backend_upgrade_perfume/rollback.sql`
4. Restore the Prisma client to the previous schema (`git checkout <prev> -- prisma/schema.prisma`
   then `npx prisma generate`), and redeploy the previous application build.
5. **Validate:** app boots, catalogue reads work, orders/customers intact.

## Data-loss warning
The reverse script **drops the new tables** (scent profiles, quiz sessions, loyalty ledger,
referrals, sample credits, discovery sets, support threads, approvals, audit log, integration/webhook/
job/flag tables, product variants/media, supplier). Any data captured in those since the forward
migration is lost on rollback. If that data matters, `pg_dump` those tables before rolling back.

## Restored-column caveat
Dropped Product columns (`material`, `lensType`, `warranty`, `waterResistance`) are re-created **empty**
by rollback (their values were removed by the forward migration). This is acceptable because they are
non-perfume fields with no business use.

## Preferred path
Prefer **fixing forward** with a new additive migration over rolling back, unless the schema change
is the direct cause of an outage.

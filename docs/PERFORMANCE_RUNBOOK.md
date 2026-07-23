# Performance verification

## Database query budget

Run `npm run test:queries` against a staging database containing representative catalogue, customer,
and order volumes. The check measures repeated bounded catalogue/admin queries and fails when any
query exceeds the default one-second p95 budget.

Optional controls:

- `QUERY_PERF_ITERATIONS` (default `10`, maximum `50`);
- `QUERY_P95_BUDGET_MS` (default `1000`).

This check is read-only. A small development dataset can prove query correctness but cannot certify
production scale; rerun it after staging has representative data.

On Windows, if Prisma reports that no credentials are available in the security package, use the
operating system CA store before running the check:

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm.cmd run test:queries
```

## HTTP smoke load

Start a production build, then run `npm run test:load`. The script requests the homepage, shop, and
bounded products API with 10 concurrent workers and fails above a 1% error rate or a two-second p95.

Optional controls:

- `LOAD_TEST_BASE_URL` (default `http://localhost:3000`);
- `LOAD_TEST_CONCURRENCY` (default `10`, maximum `50`);
- `LOAD_TEST_REQUESTS` (default `100`, maximum `2000`);
- `LOAD_TEST_P95_BUDGET_MS` (default `2000`).

Never point a high-concurrency run at production without an approved test window. Use staging for
capacity work and increase concurrency gradually while observing database connections and errors.

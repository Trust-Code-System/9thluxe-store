# Background jobs runbook

The application exposes three authenticated job endpoints. A scheduler may call them with `GET` or
`POST` and the header `Authorization: Bearer <CRON_SECRET>`. `GET` supports Vercel Cron; `POST`
supports external schedulers and manual operational checks.

| Job | Endpoint | Recommended cadence |
| --- | --- | --- |
| Deliver outbox events | `/api/internal/jobs/process-outbox` | Every minute |
| Release expired stock reservations | `/api/internal/jobs/release-reservations` | Every 5 minutes |
| Reconcile pending Paystack payments and refunds | `/api/internal/jobs/reconcile-payments` | Every 5 minutes |

`CRON_SECRET` must be a random value of at least 32 characters and must be configured in both the
application and scheduler. Never put it in a URL, log, repository file, or browser-side variable.

Each endpoint is safe to call again after scheduler timeouts:

- the outbox claims events and deduplicates provider effects;
- reservation release conditionally transitions only live reservations;
- payment reconciliation processes only unresolved attempts and non-terminal refunds, using the same
  idempotent settlement transactions as signed webhooks.

Alert when a job returns a non-2xx response, has not succeeded within twice its expected cadence, or
reports failed/review-required work. Payment attempts with a reconciliation failure code and refunds
in `NEEDS_ATTENTION` require manual comparison with the Paystack dashboard before state is changed.

After deployment, verify each job once with a staging secret and confirm its structured success log.
Do not enable the production schedule until the Paystack test-mode purchase and missed-webhook
reconciliation scenarios have passed.

Vercel Hobby currently permits each cron only once per day, which is not frequent enough for these
commerce jobs. On Hobby, use an external scheduler capable of the recommended cadence. On Vercel
Pro or Enterprise, add the three paths to `vercel.json` at the cadence above. Vercel automatically
sends `CRON_SECRET` as a bearer token and invokes cron paths with `GET`.

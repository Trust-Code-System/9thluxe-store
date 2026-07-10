# Data Governance & Privacy

Baseline: Nigeria **NDPA**, designed to extend to GDPR-style rights. This documents purposes,
consent, retention, and the export/deletion boundaries.

## Data-processing inventory (categories)
- **Account** (email, name, password hash) — auth. Lawful basis: contract.
- **Order/shipping** (address snapshot, phone, items, totals) — fulfilment + accounting.
- **Payment** — handled by Paystack; we store references/status only, never card data.
- **Behavioural** (search/view/recommendation events) — product improvement; personalization tied to
  identity requires consent.
- **Scent profile / quiz** — personalization; consent recorded (`ScentQuizSession.consentGiven`,
  `ConsentRecord`).
- **Support/reviews** — service + social proof.

## Consent
`ConsentRecord` stores purpose + channel + granted + source. Marketing on any channel
(email/WhatsApp/SMS) requires stored consent; transactional messages do not. Promotional WhatsApp is
**never** sent without valid consent (enforced in the notification dispatcher + `whatsapp_marketing`
flag).

## Minimization & AI boundary
Addresses, payment data, private conversations, and full profiles are **not** sent to AI providers.
Prompts are PII-redacted and length-bounded (`scrubPrompt`). Only the minimum needed for a task
(e.g. notes/budget/occasion) is shared.

## Rights & workflows (boundaries implemented)
- **Export:** assemble the customer's own records (profile, orders, reviews, consents) — a service
  boundary is defined; wire an admin/self endpoint that reads only the requester's rows.
- **Deletion:** soft-delete/anonymize workflow — cascade rules remove child records; order records
  are pseudonymized (retain financial/accounting minimum) rather than hard-deleted where legally
  required. Every action writes an `AuditLog` entry.
- **Retention:** define per-category retention with the owner; behavioural events aggregated/
  anonymized after the window.

## Security of data
Encryption in transit (HTTPS/managed Postgres TLS). Encryption at rest via the managed DB provider.
Secret rotation supported via env (`lib/env.ts`) — no secrets in code. Access to sensitive records is
role-gated and access-logged (`AuditLog`).

## Cookies / tracking
First-party analytics events are separated from marketing (`lib/analytics/events.ts`); marketing
personalization is consent-gated. Cookie banner/consent UI is a frontend concern; the backend honors
the recorded consent.

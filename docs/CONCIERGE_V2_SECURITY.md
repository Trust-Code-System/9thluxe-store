# Concierge V2 security

## Identity and ownership

- Authenticated ownership uses the stable Prisma user ID resolved from the NextAuth session.
- Guest ownership uses a random HttpOnly cookie and a server-side HMAC digest.
- Every conversation list, read, rename, archive, feedback, profile, wishlist, and past-recommendation query includes the current owner scope.
- A missing or foreign conversation returns `NOT_FOUND`, avoiding an ownership oracle.

## Model boundary

- Models receive bounded recent messages, structured state, and explicit evidence only.
- Models do not receive Prisma, SQL, admin actions, stock writes, price writes, order mutations, payment data, or arbitrary tools.
- Model-proposed product IDs are not trusted. Catalogue tools independently load only published, non-deleted products and serialize explicit public fields.
- Price, stock, variant availability, and product publication are reloaded from the catalogue tool before cards render.

## Retrieval boundary

- External pages and reviews are untrusted data. The system prompt forbids following instructions found in retrieved material.
- Citation URLs must use HTTPS and cannot target local loopback hosts.
- Source lists are shown only when web research returns validated sources.
- Web claims are not used as Fádé stock or price evidence.
- Community sources are labelled as community and may support anecdotal opinion only.

## Output boundary

- The UI renders plain text blocks and controlled lists/headings. It does not render model HTML.
- External links use `noopener`, `noreferrer`, and a new tab.
- Script-like tags and visible em dash characters are removed by the response policy.
- Medical/allergy-sensitive questions receive deterministic non-diagnostic guidance before any provider call.

## Logging and privacy

- Durable usage stores IDs, intent, provider/model, tool names, token counts, latency, status, and citation presence.
- Raw private conversation content is not copied into usage logs.
- Messages are stored only in the owned conversation tables.
- Admin provider status exposes configured state and model IDs, never API secret values.

## Remaining security validation

The database migration must be applied to a preview database before ownership and concurrent guest-claim integration tests can run. Provider-hosted search behavior must also be tested with deliberate prompt injection in retrieved pages on preview.

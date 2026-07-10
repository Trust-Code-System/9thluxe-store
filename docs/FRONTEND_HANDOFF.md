# Frontend Handoff — Olfactory Atelier Redesign

Branch: `upgrade/frontend-atelier` (off `main`, integrated with the current backend).

## What was done (phased)

**Phase 1 — Foundations**
- New design-token palette (parchment/espresso/amber/moss) in `app/globals.css`.
- Editorial fonts wired via `next/font` (Playfair Display + Inter).
- Cinematic hero, refined header nav, redesigned product cards, homepage brand story.

**Phase 2 — Shop & PDP**
- Shop wrapped in site layout; editorial header, result count, "Clear all",
  designed no-results state; softened filter card.
- Product detail: breadcrumb, amber brand eyebrow, authenticity/delivery/returns trust row.
- Homepage discovery trio + fragrance-family tiles retoned; newsletter refreshed;
  fixed the incomplete "Sub" footer label.

**Phase 3 — Discovery**
- New **AI Scent Concierge** page (`/concierge`) wired to `POST /api/v1/concierge`:
  suggested prompts, catalogue-grounded product cards with availability, sample-first
  toggle, loading/error/unavailable states, AI label + disclaimer.
- Restyled Find Your Scent; added Concierge to nav + a homepage concierge invitation.

**Phase 4 — Cart & Account**
- Cart bag heading, warmer empty state, amber line-item eyebrows, amber free-shipping
  progress, secure-checkout note. Account avatar/crown/stat icons/tier badges retoned.

**Phase 5 — Editorial, trust & config**
- Journal wrapped in layout + retoned; About page eyebrow + warm icons + new
  **Authenticity Centre** section.
- **Free-shipping threshold + flat fee now sourced from `lib/config/commerce.ts`**
  (server → cart & checkout props) instead of hard-coded values.
- Frontend docs (this set).

## Verification
- `npm run typecheck` — clean
- `npm run build` — all routes compile
- Lint clean on changed files

## Commands
```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

## Preview
Vercel builds a preview per push of `upgrade/frontend-atelier`. Merge into `main`
only after reviewing the preview.

## Notes & remaining external inputs
- The Concierge returns live results only when the `ai_concierge` feature flag is on
  and an AI provider key is configured; otherwise it shows a graceful "resting" state.
- Journal article images are gradient placeholders pending real editorial assets.
- Not yet built (future phases): Gift Concierge UI, Layering Lab UI, Compare polish,
  full Scent Wardrobe (owned/samples/ratings), automated Playwright + visual-regression
  + axe test suites.
- Express shipping (₦35,000) and gift wrapping (₦2,500) in checkout are not yet part of
  `commerce.ts` config; the free-shipping threshold and base flat fee are.

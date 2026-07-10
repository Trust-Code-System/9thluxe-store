# Fàdè Design System — "The Olfactory Atelier"

Warm, editorial, tactile. The system is token-driven (Tailwind v4 `@theme` in
`app/globals.css`) so a palette change restyles the whole site.

## Palette (light)

| Token | Value | Use |
|---|---|---|
| `--background` | `#F4EFE7` | Parchment page background |
| `--card` | `#FFFDFC` | Warm white surfaces |
| `--foreground` | `#18130F` | Primary ink (body/headlines) |
| `--primary` | `#2C201A` | Deep espresso/walnut — primary buttons |
| `--accent` | `#A0693A` | Liquid amber — links, eyebrows, highlights |
| `--muted-foreground` | `#6A5D4E` | Secondary text |
| `--border` | `#E2D9CA` | Hairline borders |
| `--moss` | `#696B55` | Soft secondary accent (in-stock, tags) |
| `--bronze` | `#8A7052` | Muted bronze |
| `--espresso` / `--walnut` | `#211813` / `#3A2922` | Dark environments, pedestals |

Dark mode (`.dark`) mirrors these into an espresso-black environment with a
brighter amber (`#C08A4E`). All values live in `app/globals.css`.

### Contrast
- Ink on parchment and ivory surfaces far exceeds WCAG AA.
- `muted-foreground` was darkened to `#6A5D4E` to keep body text ≥ 4.5:1 on parchment.
- Amber is used for emphasis/large text and non-text UI (borders, icons, stars),
  not for small body copy on light surfaces.

## Typography
- **Serif (headlines):** Playfair Display — loaded via `next/font` as `--font-playfair` → `--font-serif`.
- **Sans (interface):** Inter — `--font-inter` → `--font-sans`.
- Global heading styles are defined in the base layer (`h1`–`h6`).

## Utilities (globals.css)
- `.eyebrow` — small-caps amber label used above section titles.
- `.paper-texture` — extremely subtle paper grain for select sections.
- `.amber-glow` — warm radial glow for hero/pedestals/CTA panels.
- `.animate-atelier-float` — slow ambient particle float (disabled under `prefers-reduced-motion`).

## Components touched in the redesign
Header nav, announcement bar, hero, product cards, shop grid + filters, product
detail (breadcrumb, brand eyebrow, trust row), homepage sections (discovery trio,
fragrance families, concierge invitation, newsletter, brand story), cart
(items/summary/empty), account overview, journal, about/authenticity, and the new
AI Scent Concierge.

## Conventions
- Prefer semantic tokens (`bg-card`, `text-accent`) over raw hex.
- Product/brand names use the serif; eyebrows/labels use uppercase tracked sans.
- Never hard-code commerce policy (see shipping threshold sourced from
  `lib/config/commerce.ts`).

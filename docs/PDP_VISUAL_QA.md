# PDP Visual QA

Branch `upgrade/pdp-discovery-sol`. Manual visual QA performed in the in-app browser against the local
dev server, on the seed catalogue (`nocturne-eau-de-parfum`, `aurelius-noir-eau-de-toilette`).

> Note on imagery: the seed fixtures reference `/placeholder.png`, which in this repo is a non-perfume
> placeholder graphic. All layout QA below is valid; real high-resolution bottle media must be loaded by
> the merchant before launch (tracked in Handoff / TODO).

## Breakpoints exercised

| Size | Result |
| --- | --- |
| 375 × 812 (mobile) | ✅ Single-column stack; priority order product → price/variant → add-to-cart → trust → scent explanation → notes/timeline. At-a-glance is a 2-col grid. Pyramid/timeline cards read cleanly. Sticky purchase bar appears only after the hero scrolls away, shows name/price/size/stock + Add, and does not cover content (reserved bottom padding + safe-area inset). Compare tray floats above it. No horizontal overflow. |
| 800 (tablet pane) | ✅ Editorial stack full-width; grids reflow to 2–3 columns; no compressed-desktop feel. |
| ≥1024 (desktop) | ✅ Two-column hero (gallery left, purchase panel right); panel is `position: sticky` on scroll. Editorial sections span a comfortable measure; profile grid up to 4 columns. |

(Design is fluid between these; 360/390/430/768/1440 use the same responsive rules.)

## Section-by-section checks

- **Breadcrumb** — Home / Perfumes / Brand / Product, truncates the product name. ✅
- **Gallery** — main stage + thumbnails; arrows/expand on hover+focus; full-screen viewer opens/closes; broken-image fallback in place. ✅
- **Purchase panel** — brand, name, concentration, olfactory desc, rating/"No reviews yet", price, **≈ ₦950/ml** derived from the 100ml size, stock pill, qty, Add to cart, Buy now, Wishlist, Compare, Share, gift line, trust row with **real** shipping (Flat ₦2,500 — free over ₦500,000) and 7-day returns. ✅
- **At a glance** — House/Concentration/Family with **Brand-provided** provenance chips; icons decorative. ✅
- **What it smells like** — "Opens with bergamot / heart turns to oud / dries down to amber, vanilla", composed only from real notes. ✅
- **Pyramid** — top/heart/base with note chips (link to `/shop?note=`). ✅
- **How it wears** — 4 stages with real notes and decaying intensity bars + editorial caution. ✅
- **Wearing it in Nigeria** — condition chips; verdict ("Best with controlled application" for the ORIENTAL EDP) with descriptive, non-guaranteed copy; no geolocation. ✅
- **Will this suit me?** — entering "oud, amber" returned **75 / Strong match** citing "Contains oud", "Contains amber" (real notes), labelled AI-assisted. ✅
- **Reviews** — clean "No reviews yet" empty state (seed has none). ✅
- **Q&A** — honest "coming soon / not enabled in this environment" state with categories + search shell. ✅
- **Authenticity** — Retailer-inspected status + seal/batch/report guidance (only true claims). ✅
- **Delivery/returns FAQ** — 9 accordion items from the single policy source. ✅
- **Brand & perfumer** — brand block + "All Fádé" link (perfumer hidden — none set). ✅
- **Compare** — floating tray shows count; `/compare` page renders side-by-side with real values (EDP, oriental, real notes) and dims identical rows; nulls show "—". ✅

## Correctly hidden (no fake data)

- **Main accords** — hidden (no `mainAccords` in data). ✅
- **Performance profile** — hidden (no structured review ratings yet). ✅
- **Layering Lab** — hidden for a 1-per-family catalogue (no real partners); appears when partners exist. ✅
- **Explore further (recommendations)** — hidden when groups resolve empty; header never shows alone. ✅

## Fixes made during QA

1. Sticky mobile bar was showing on first load — corrected the IntersectionObserver so it appears only
   after the hero scrolls **above** the viewport (`boundingClientRect.top < 0`), not while below the fold.
2. Layering Lab and Recommendations previously left an **empty section header** when they had no items —
   moved their headers inside the components so the whole section hides when empty.
3. Hardened `getPdpPolicy` so a misconfigured env (empty `UPSTASH_REDIS_REST_URL` in local `.env`, which
   makes `lib/env` throw in dev) degrades to schema-default shipping instead of crashing the PDP.

## Remaining visual notes

- Replace seed placeholder imagery with real bottle photography (merchant task).
- Re-QA once real media, sample/discovery variants, accords and reviews exist so the currently-hidden
  sections can be visually verified with content.

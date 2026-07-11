# Homepage Hero Rebuild — Handoff (Stage 1)

Replaces the fictional illustrated "Fádé flacon" homepage hero with a cinematic hero that presents a
**real, merchant-approved, published fragrance** from the catalogue, or an **honest neutral
placeholder** when nothing is approved. No fabricated bottle, no invented perfume information.

## What changed

### New: Scent Atlas hero contract (no DB migration)
- `lib/hero/types.ts` — typed public-safe contract (`HeroData`, `HeroFeaturedProduct`,
  `HeroIngredientAsset`, `HeroNoteArrangement`, `HeroMotionProfile`, plus the Stage 2
  `HeroScentAnnotation` shape). `ProminenceLabel` reused from the existing fragrance system; it is a
  qualitative **perceived-prominence** band, never a formulation percentage.
- `lib/hero/select.ts` — `selectHeroFeaturedProduct()` (Prisma query) + `buildHeroData()` (pure,
  unit-tested). Hero eligibility requires ALL of: `publishStatus = PUBLISHED`, `deletedAt = null`,
  `isFeatured = true`, and at least one merchant-owned catalogue image. Notes (`notesTop/Heart/Base`)
  are mapped through the existing approved ingredient library (`lib/fragrance/normalize` +
  `art.ts`); only notes that resolve to an approved in-house asset become falling objects. Unknown
  notes are dropped, never invented. On any DB error it returns `null` (placeholder).

### New: hero components (`components/home/hero/`)
- `hero-section.tsx` — **server component**. Editorial copy, product identity, note arrangement and
  CTAs are fully server-rendered (good FCP, reachable without JS). Renders the product hero or the
  neutral placeholder.
- `hero-stage.tsx` — server, static composition: real product image on a dark **wet-stone pedestal**
  over a **shallow reflective water** surface, with contact shadow, glass-highlight sweep and a soft
  reflection. This is the LCP element, the poster fallback, and the reduced-motion composition.
- `hero-placeholder-stage.tsx` — neutral pedestal/water with a soft light where a featured bottle
  would rest. No bottle, no invented copy.
- `note-arrangement.tsx` — accessible Top/Heart/Base summary from approved notes; empty tiers hidden.
- `hero-scene.tsx` — **client**, decorative ingredient descent. One `requestAnimationFrame` loop,
  transforms written straight to the DOM via refs (no per-frame React re-render), pauses via
  `IntersectionObserver` (off-screen) and the Page Visibility API (hidden tab), full cleanup on
  unmount, subtle pointer parallax on fine pointers, ≥60% fewer particles on mobile. `aria-hidden`;
  particles use in-house SVG data URIs (no scraping). Occlusion note below.
- `hero-scene-mount.tsx` — client boundary that code-splits the scene (`next/dynamic`, `ssr:false`)
  and skips it entirely under `prefers-reduced-motion`.

### Edits
- `app/page.tsx` — selects hero data server-side and passes it to `<HeroSection>`.
- `components/home/hero-section.tsx` — **removed** (old fictional-bottle hero). `components/home/flacon.tsx`
  is kept (still used by `product-card-skeleton.tsx`).
- `app/globals.css` — added `.hero-pedestal`, `.hero-water`, `.hero-water-ring`, `.hero-glass-sweep`,
  `.hero-pedestal-rotate`; all disabled under `prefers-reduced-motion`.
- `components/ui/section-header.tsx` — added `flex-wrap` so the "View all …" link wraps instead of
  overflowing at 320px (this was a pre-existing page-level overflow, not caused by the hero).
- Eyebrow copy changed to **"Fádé · Lagos · Curated Perfumery"** (middot separators, no em dashes).
  Headline "Worn close, remembered long." retained.

## How the merchant activates a product hero
The hero is gated on explicit approval. To feature a fragrance: set a **published** product's
`isFeatured` flag (existing admin product toggle). The most recently updated featured product wins,
so "reverting" is simply re-featuring the previous one. With no featured product the homepage shows
the neutral placeholder. Local dev currently has no featured product (placeholder is active).

## Verification performed
- `npm run lint` (includes em-dash guard) — clean.
- `npx tsc --noEmit` — clean.
- `tests/hero/select.test.ts` (vitest) — 11/11 pass (eligibility, note mapping, unknown-note drop,
  no percentages, coming-soon).
- `tests/e2e/hero.spec.ts` (Playwright + axe) — passes in both product-hero and placeholder states:
  route health, positioning copy, no fictional flacon, no em dashes, no native `<select>`, no
  unrelated categories, correct CTA destination, meaningful product alt, keyboard focus, no
  horizontal overflow at 320/360/390/430, axe (no serious/critical), reduced-motion static
  composition (no falling scene), animation cleanup across navigation.
- Browser-verified desktop (1280) and mobile (320/390) manually: product hero and placeholder both
  render, bottle at correct size, 0 document overflow, decorative particles absent from the a11y tree.

## Known limitations / follow-ups
- **Ingredient occlusion**: the decorative scene is a single-loop overlay with depth cues (blur,
  scale, opacity). Particles render behind the stage's transparent regions and are occluded by the
  opaque bottle; a dedicated front-of-bottle layer is deferred to keep one animation loop. True
  split behind/front layering is a Stage 2 refinement.
- **Static poster asset**: the SSR static composition *is* the poster/reduced-motion fallback (built
  from the same real image), so no separate WebP/AVIF file is shipped. If a pre-rendered poster is
  desired for WebGL-failure parity later, generate it from the same composition.

## Merchant-owned assets still required (for the original Hermès direction)
The requested **Hermès *Un Jardin sur le Nil*** hero could NOT be used honestly: it is not a
published catalogue product, there is **no licensed/merchant-owned bottle image** in the repo, and of
its notes (green mango, grapefruit, lotus, calamus, sycamore, incense) only **"incense"** exists in
the approved ingredient-art library. Per the truthfulness rules it was not fabricated. To ship it
later the merchant must supply: (1) a licensed bottle image, (2) approval to feature it, (3) verified
notes, and (4) approved ingredient art for the missing notes.

## Not included (Stage 2, agreed separately)
Typewriter scent-note annotations with connector lines, and the dedicated admin hero-preview /
annotation-approval UI. The `HeroScentAnnotation` type is defined so the data shape is stable.

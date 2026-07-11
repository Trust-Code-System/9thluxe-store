# Fádé — "SILLAGE" Redesign (July 2026)

Complete visual rebuild of the customer-facing store. Backend, APIs, Prisma data,
auth, cart, checkout and Paystack flows are preserved untouched.

## Creative direction

**Concept: Sillage** — the trail a fragrance leaves in the air after someone walks
through a room. The site is built around air, dusk light and botanical darkness,
not gold-and-marble luxury clichés.

Two orchestrated worlds inside a single theme (no user-facing theme toggle):

| Surface | Use | Base |
|---------|-----|------|
| **Night** (`:root` / `data-surface="night"`) | Immersive: home hero, discovery, journal, drops, storytelling | Carbon-green `#111310`, velvet `#1A1D17`, almond text |
| **Day** (`data-surface="day"`) | Commerce: shop grid, purchase panels, cart, checkout, account, forms | Almond parchment `#EFE6D6`, ink text, plum-wine CTAs |

The customer's journey deliberately moves from cinematic night (desire) into
almond daylight (decision). That transition is the identity.

### Palette (inspired by the client moodboard, refined for WCAG)

- Carbon `#111310` · Velvet `#1A1D17` · Moss-border `#2E3227`
- Almond `#E7D4BB` · Parchment `#EFE6D6` · Warm white `#F8F3E9`
- Sandalwood `#8A7B63` (quiet metal/borders)
- Plum wine `#3E2129` (primary CTA on day), plum accent `#6E3B49`
- Dried-rose `#C09EA9` (accent on night)

### Typography

- **Display:** Fraunces (variable optical size; light weights; italics for scent poetry)
- **Body/UI:** Instrument Sans
- **Data:** IBM Plex Mono — eyebrows, prices, ml sizes, note intensities, order numbers

### Signature elements

1. **The Veil** — slow drifting vapor gradients + film grain on night surfaces.
2. **Condense reveal** — content enters blur→sharp, rising ~24px (motion lib),
   like scent condensing on glass. Global motion language.
3. **Scent spectrum** — notes rendered as mono-labelled horizontal intensity bars,
   not pyramid clip-art.
4. **Tilted light product staging** — layered radial light + reflection + subtle
   3D mouse tilt on desktop (disabled for reduced motion / touch).

### Motion rules

- Entrances 500–700ms, easing `cubic-bezier(0.16,1,0.3,1)`, stagger 60–80ms.
- Micro-interactions 180–250ms. Exits ~60% of enter.
- `prefers-reduced-motion`: all reveals render instantly, vapor is static.

## Task log

- [x] 1. Design tokens, fonts, motion primitives (`app/globals.css`, `app/layout.tsx`, `components/motion/`)
- [x] 2. Site chrome: header, nav, footer, announcement (`components/layout/*`)
- [x] 3. Homepage rebuild (`app/page.tsx`, `components/home/*` — original SVG flacon staging, no stock imagery)
- [x] 4. Product card/grid + shop; `/category/perfumes` → permanent redirect to `/shop`; collections rebuilt on real DB data
- [x] 5. PDP: new identity via tokens, mono breadcrumb; all data plumbing untouched
- [x] 6. Cart page/summary/item restyle + checkout shell, steps, success page
- [x] 7. Find-your-fragrance quiz, discovery, journal (index + article), drops rebuilt
- [x] 8. Auth signin/signup, account layout, about/faq/help/privacy/terms
- [x] 9. Purged: watch/glasses images deleted, orphaned old components removed, invented stats removed
- [x] 10. QA: eslint ✓ (0 errors) · tsc ✓ · vitest 168/168 ✓ · production build ✓ · responsive sweep

## Functional fixes made along the way

- `lib/env.ts`: empty-string env vars now treated as unset (dev crash: `UPSTASH_REDIS_REST_URL=""`).
- `components/checkout/checkout-content.tsx`: React hook ran after a conditional
  return (crash when cart hydrated empty→filled); redirect now waits for cart hydration.
- `lib/stores/cart-store.ts`: added `hasHydrated` flag.
- `components/motion`: entrances degrade to static rendering under
  `prefers-reduced-motion` **and** in hidden documents (background tabs/prerender),
  so content is never invisible if animation frames don't run.
- `ProductCard`: falls back to the branded `/placeholder-flacon.svg` when an
  image URL is missing or fails to load.

## Still required from the client (external)

1. **Product images (urgent, production data):** the live database's products
   ("Nocturne Eau de Parfum", one other) have a **Bitcoin promo graphic** stored
   as their product image, and "Aurelius Noir" has a broken image URL. This is
   visible on the live site today and predates the redesign. Fix via the admin
   panel by uploading real bottle photography (ideally on dark/neutral
   backgrounds, 4:5 ratio, ≥1200px).
2. **Product flags:** no products are marked featured/bestseller/new/limited in
   the DB, so homepage "The Edit" falls back to latest products and the
   collections edits section shows the full catalogue. Set flags in admin.
3. **OG image:** `/og-image.jpg` referenced in metadata does not exist in
   `public/` — export a 1200×630 brand card in the new identity.
4. **Brand photography (optional):** the redesign intentionally uses zero stock
   photography. If you want photographic storytelling moments (journal covers,
   about page), commission perfume imagery in the Sillage palette.
5. **Admin area:** intentionally out of scope; it keeps the night tokens and
   its theme toggle is now inert (the `.dark` class no longer changes tokens).

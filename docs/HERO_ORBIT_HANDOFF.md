# Homepage Hero - Orbital Carousel (Stage 2) Handoff

Implements the cinematic rotating perfume showcase from the creative brief as a progressive
enhancement over the approved Stage 1 hero. Research/asset provenance:
`docs/HERO_ORBIT_RESEARCH_PROPOSAL.md` (read that first - it records what the catalogue honestly
supports and what is blocked).

## Activation & rollback (merchant-controlled)

- **OFF by default.** The homepage ships unchanged (Stage 1 hero) until `hero_orbit` is added to the
  `FEATURE_FLAGS` env var (existing flag system, `lib/config/feature-flags.ts`).
- With the flag on, the orbit renders only when **>= 2 slides** are usable (APPROVED + enabled +
  transparent asset + published, non-deleted product). Anything less falls back to Stage 1
  automatically - same render path, no redeploy needed. Rollback = remove the flag.
- Per-slide gates live in `lib/hero/orbit-config.ts` (`HomepagePerfumeSlide`: approvalStatus,
  enabled, displayOrder, pedestalStyle, bottleAsset). Aurelius Noir is DRAFT/blocked there because
  its catalogue image depicts a Terre d'Hermes bottle (see proposal).

## What was built

### Data layer (no DB migration)
- `lib/hero/orbit-config.ts` - curated, merchant-reviewable slide config (the brief's
  `HomepagePerfumeSlide` shape).
- `lib/hero/orbit.ts` - pure builders + best-effort Prisma selector. Notes map through the approved
  ingredient library (max 5 visuals per slide); annotations use the library's approved
  `shortDescription` (first sentence), tier from the product record, and the qualitative
  **perceived prominence** scale (Trace/Subtle/Noticeable/Prominent/Dominant). No percentages,
  no invented data; unknown notes drop. DB errors -> null -> Stage 1 hero.
- `lib/hero/select.ts` - exported `assetsForTier` + `isComingSoon` for reuse (behaviour unchanged).

### Assets
- `public/hero/nocturne-bottle.webp` (120 KB) and `public/hero/vesper-velvet-bottle.webp` (90 KB):
  transparent cutouts machine-cut from the merchant-owned catalogue renders, visually QA'd (clean
  edges, no recolour, proportions intact). The Nocturne cutout retains a faint baked-in contact
  reflection at its base - reads naturally on the pedestal; flagged for merchant review.

### Components (`components/home/hero/orbit/`)
- `hero-orbit-section.tsx` (server): identical left copy/CTAs to Stage 1, orbit on the right.
- `orbit-rotator.tsx` (client): the showcase. Key mechanics:
  - **One coordinated timeline**: a single dwell timer (5.2s) advances the active slide; slot
    movement is a one-shot WAAPI run per bottle (~1s, custom easing) with a mid keyframe on the
    ellipse - **no continuous rAF loop**, only transform/opacity/filter animate.
  - Depth states per brief: front scale ~1.06/opacity 1/no blur; rear ~0.66/0.25/2.5px.
  - With 2 slides the rear rests at ~130deg (visible right-back, never hidden behind the front);
    transitions travel one orbital direction so paths never cross.
  - Ingredient scene + annotation render **only for the front perfume**, remount per rotation;
    annotation cycles which ingredient it highlights per revolution. Typewriter is CSS `steps()`
    on the name only (no per-character React state); connector line is a drawn SVG stroke.
  - **Pauses** on hover/focus of the region (resumes after 1.5s), off-viewport
    (IntersectionObserver), hidden tab (Page Visibility); all cleaned up on unmount.
  - **Mobile (<768px)**: simplified mode - one bottle, crossfade, swipe, <=3 ingredients, one
    annotation, no blur filters. Accessible dots (>=24px hit targets, labelled, aria-current).
  - **Reduced motion**: no auto-rotation, no WAAPI, entrance animations jump to their final frame
    (CSS), full product info + working CTAs remain - no content loss. Slide 0 is server-rendered
    (deterministic first paint = LCP/poster; first bottle eager + fetchpriority=high, rest lazy).
- `app/globals.css` - `.orbit-*` styles (theme-aware via existing custom properties; light-mode
  connector derives from `--champagne` + foreground mix) + reduced-motion overrides.
- `app/page.tsx` - flag + selector wiring; Stage 1 path untouched.

## Verification performed (2026-07-11)
- `tsc --noEmit`, `npm run lint`, `vitest run` - clean; 227/227 unit tests including new
  `tests/hero/orbit.test.ts` (12 tests: eligibility gates, no percentages, ingredient cap,
  unknown-note drop, <2 slides -> null, display order).
- Flag ON (local dev): Playwright-verified desktop rotation (front product swaps after dwell),
  0px horizontal overflow at 1440/390, exactly one h1, mobile simplified mode shows one bottle,
  reduced-motion is static with visible CTA; axe (WCAG A/AA, all 8 audited routes) passes with the
  orbit active; home route sweep (fails on any console/hydration error) passes.
- Flag OFF: full storefront + hero + a11y regression suites (see repo QA reports).

## Showcase slides (2026-07-12, merchant-directed)

Per the merchant, the three expansion fragrances (Tom Ford Oud Wood, Creed Aventus, Dior Sauvage
Elixir) are **showcase-only**: recognisable bottles shown as part of the site's world, NOT sold
through checkout. They are decoupled from the catalogue entirely.

- A slide is now one of two kinds (`lib/hero/orbit-config.ts`): a PRODUCT slide (no `display`,
  purchasable, requires a PUBLISHED catalogue product) or a SHOWCASE slide (`display` present:
  brand/name/family/concentration/notes live in config; not purchasable).
- Showcase slides render from config alone via `buildShowcaseSlide` - no price, stock, publish or DB
  dependency. `selectHeroOrbit` only queries the catalogue for PRODUCT slides, so a DB hiccup
  degrades to the showcase slides instead of losing the carousel.
- In the UI, showcase slides show the bottle + editorial info + a subtle "In the Fádé world" label
  and **no Explore/Shop actions and no availability claim** (honest: not for sale).
- Notes were verified against official/public sources (2026-07-12); only notes in the approved
  ingredient library become visuals/annotations, the rest are dropped (never invented).
- The three DRAFT catalogue records created on 2026-07-11 are now unused by the carousel (showcase
  is config-driven). They remain DRAFT (invisible everywhere) and can be deleted in admin; even if
  later published, the slide stays showcase because its config carries `display`.
- Verified live (flag on): 5 slides roll; Nocturne + Vesper keep Explore/Shop; the three showcase
  slides show "In the Fádé world" with no buy button; zero horizontal overflow; no runtime errors.

## Expansion round status (2026-07-11, superseded by Showcase slides above)

Merchant approved adding Tom Ford Oud Wood, Creed Aventus and Dior Sauvage Elixir to the catalogue
and carousel, with: real bottle photography later (slides stay DRAFT/hidden until photos are
supplied and cut out - the in-repo AI renders were rejected per the label-accuracy rule), and a
coming-soon launch (records created as DRAFT waitlist products, priceNGN 0 placeholder, nothing
public until the merchant sets a real price and publishes).

- DRAFT slides exist in lib/hero/orbit-config.ts (slide_tf_oud_wood, slide_creed_aventus,
  slide_dior_sauvage_elixir) with bottleAsset: null.
- The three DRAFT catalogue records were created on 2026-07-12 (notes verified against public
  sources; merchant reviews in admin before publish). The one-off creation script was deleted.
- To activate a slide later: (1) supply a straight-on bottle photo, background gets cut to
  public/hero/<slug>-bottle.webp; (2) set the slide's bottleAsset + approvalStatus: "APPROVED" +
  enabled: true; (3) set the product's real price/stock and publish it in admin.
- Notes verified 2026-07-12: Oud Wood (tomfordbeauty.com, Fragrantica), Aventus (creedboutique.com,
  Fragrantica - heart is jasmine/birch/patchouli, no rose), Sauvage Elixir (dior.com, Fragrantica -
  base includes patchouli and Haitian vetiver).

## Follow-ups for the merchant
1. Enable `hero_orbit` in production once slides + cutouts + annotation copy are approved.
2. Supply a correct Aurelius Noir bottle image to unblock slide 3.
3. Optional catalogue fixes: Nocturne label reads "Oud Nocturne Amber / Extrait" (record says EDP);
   Vesper label reads "Rose & Patchouli". Third-party brand images still sitting in `public/`
   (Dior/Creed/Tom Ford/the Hermes-depicting Aurelius file) should be reviewed for removal.

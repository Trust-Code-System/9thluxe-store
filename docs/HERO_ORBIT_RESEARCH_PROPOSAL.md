# Orbital Hero: Research & Asset Proposal (Stage 2)

Pre-implementation deliverable for the cinematic rotating perfume showcase ("orbital carousel").
Per the creative brief, only real catalogue products with usable, legally sound assets may appear.
This document records what the catalogue actually supports, and what is blocked pending merchant
input. Nothing below is fabricated; gaps are stated as gaps.

## Catalogue reality (audited 2026-07-11, local dev DB)

The published catalogue contains exactly **three** products (all `PUBLISHED`, none soft-deleted,
none currently `isFeatured`). The brief suggests four slides; per its own rule ("use fewer perfumes
rather than fabricating data") this proposal uses **at most three, and only two at launch** (see
asset audit).

## Proposed sequence

Sequenced per the brief's balanced-profile guidance (fresh/citrus -> floral -> woody/amber), with no
public gender labelling.

### Slide 1 - Aurelius Noir Eau de Toilette 75ml (`aurelius-noir-eau-de-toilette`) - BLOCKED
- **Why selected**: the catalogue's only fresh-opening woody; citrus top (lemon, bergamot) gives the
  sequence its bright opener.
- **Internal lean** (never shown publicly): masculine-leaning.
- **Scent family (approved data)**: WOODY. Notes: lemon, bergamot / cedar / vetiver.
- **Candidate visual ingredients** (approved in-house art library): Bergamot (top), Cedarwood
  (heart, via "cedar" alias), Vetiver (base). "Lemon" has no approved art asset and is dropped from
  visuals (still shown in text notes). 3 ingredients = within the 3-5 desktop budget.
- **Asset source & status**: **BLOCKED.** The catalogue image
  (`public/aurelius-noir-eau-de-toilette.jpg`, ~1024px render) **depicts a Terre d'Hermès bottle**
  (label clearly reads "TERRE D'HERMES - EAU DE PARFUM"). Using a third-party trademarked bottle as
  "Aurelius Noir" in the hero would misrepresent the product and violates the brief's asset rules
  (and the Stage 1 handoff's Hermès finding). This slide is defined in the data model as `DRAFT`
  and stays off until the merchant supplies a correct, licensed Aurelius Noir bottle image.
- **Availability**: in stock (30). Purchase action valid once unblocked.
- **Merchant approval required**: YES - replacement bottle asset + slide approval.

### Slide 2 - Vesper Velvet Eau de Parfum 50ml (`vesper-velvet-eau-de-parfum`)
- **Why selected**: the catalogue's floral; rose-forward heart provides the soft middle chapter.
- **Internal lean**: feminine-leaning.
- **Scent family (approved data)**: FLORAL. Notes: pink pepper / rose / patchouli.
- **Candidate visual ingredients**: Pink pepper (top), Rose (heart), Patchouli (base). 3 ingredients.
- **Asset source & status**: merchant-owned catalogue render (`public/vesper-velvet-eau-de-parfum.jpg`,
  1024x1024, full pink-fabric background). **Background removal required** - a machine-cut
  transparent WebP will be produced locally and quality-checked; if glass edges degrade, the slide
  falls back to the Stage 1 stage treatment. **Label caveat**: the bottle art reads "ROSE &
  PATCHOULI", not "Vesper Velvet" - flagged for merchant awareness (the same image already
  represents this product across the store, so hero use adds no new inconsistency).
- **Availability**: in stock (35).
- **Merchant approval required**: YES - slide + cutout approval (content is otherwise real).

### Slide 3 - Nocturne Eau de Parfum 100ml (`nocturne-eau-de-parfum`) - proposed ACTIVE/front default
- **Why selected**: the house (Fàdè) signature oriental; oud/amber/vanilla closes the sequence with
  the woody-amber chapter. Strongest note coverage (4 approved ingredients).
- **Internal lean**: unisex.
- **Scent family (approved data)**: ORIENTAL. Notes: bergamot / oud / amber, vanilla.
- **Candidate visual ingredients**: Bergamot (top), Oud (heart), Amber + Vanilla (base). 4 ingredients.
- **Asset source & status**: merchant-owned catalogue render (`public/nocturne-eau-de-parfum.jpg`,
  1024x1024, full dark-marble background). **Background removal required** (same process/caveats as
  slide 2). **Label caveat**: bottle art reads "OUD NOCTURNE AMBER - EXTRAIT DE PARFUM" while the
  record says EDP - flagged for merchant correction; not a blocker since the image is the product's
  existing representation.
- **Availability**: in stock (50).
- **Merchant approval required**: YES - slide + cutout approval.

## Visual research basis

Inspiration (looked at, never copied or downloaded): luxury turntable/pedestal product staging as
used in official maison campaign films and premium retailer PDP stages - slow rotation, single
dominant bottle, shallow depth of field on companions, ingredient still-life around the base. All
rendered ingredients come from the existing in-house SVG ingredient-art library
(`lib/fragrance/art.ts`); all bottle imagery comes from the merchant's own catalogue files. No
Pinterest or third-party photography is reused.

## Asset production plan

1. Machine background removal (local, one-off script; no new runtime dependency) from the two
   merchant-owned renders -> transparent WebP (~1024px) + AVIF where beneficial, stored under
   `public/hero/`.
2. Manual visual QA of edges/glass at 2x zoom in both themes; restrained CSS contact shadow is added
   by the stage, not baked into the asset.
3. If a cutout fails QA it is not shipped; that slide renders on the Stage 1 wet-stone stage
   treatment (masked composition) instead, or is disabled.
4. Third-party brand images found in `public/` (`dior-sauvage-*`, `creed-aventus-*`,
   `tom-ford-oud-wood-*`, plus the Hermès-depicting Aurelius file) are **not** used by the hero.

## Annotation content source

Typewriter annotations use only: the approved ingredient display name, its tier (top/heart/base)
from the product record, one sentence derived from the ingredient library's approved editorial
description, and the qualitative **perceived prominence** band (trace / subtle / noticeable /
prominent / dominant) derived from listing order. No percentages, ever. All annotation strings ship
as `DRAFT` and require merchant approval before the flag is enabled in production.

## Rollout & fallback

- New `hero_orbit` feature flag (existing `lib/config/feature-flags.ts` system), **default OFF** -
  the approved Stage 1 hero remains the homepage until the merchant enables the flag.
- Fallback ladder: full desktop orbit -> simplified mobile/tablet mode -> reduced-motion/low-power
  static composition (Stage 1 stage) -> Stage 1 hero (flag off or <2 usable slides).
- Performance: CSS transform/opacity + one coordinated timeline (no new animation library, no 3D
  framework); first bottle eager, next preloaded, rest lazy; pauses off-viewport, on hidden tab and
  on hover/focus of interactive controls.

## Expansion round (merchant-requested, 2026-07-11)

The merchant asked for more perfumes in the carousel. The catalogue only has three products, so
growing the orbit honestly means growing the catalogue with real third-party fragrances the store
intends to carry. Three candidates already have (imperfect) bottle renders in `public/`:

| Candidate | Profile slot | Internal lean | Widely documented notes (to verify against official pages before publication) | Ingredient-art coverage | Asset status |
| --- | --- | --- | --- | --- | --- |
| Tom Ford Oud Wood EDP | woody/smoky | unisex | rosewood, cardamom / oud, sandalwood / tonka, vanilla, amber | oud, cardamom, sandalwood, tonka bean, vanilla, amber (excellent) | `tom-ford-oud-wood-perfume-bottle.jpg`: upright AI render; main label legible and correct, sub-lines garbled at close zoom |
| Creed Aventus EDP | fresh/fruity chypre | masculine-leaning | bergamot, blackcurrant, apple, pineapple / birch, patchouli, rose / musk, oakmoss, vanilla | bergamot, patchouli, rose, musk, vanilla (good) | `creed-aventus-perfume-bottle.jpg`: upright AI render; CREED emblem distorted, lower label text is gibberish |
| Dior Sauvage Elixir | spicy/aromatic | masculine-leaning | grapefruit, cinnamon, nutmeg, cardamom / lavender / licorice, sandalwood, amber, vetiver | cardamom, lavender, sandalwood, amber, vetiver (good) | `dior-sauvage-elixir-perfume-bottle.jpg`: bottle photographed LYING ON ITS SIDE with mirrored/garbled label - unusable on a pedestal |

**Asset honesty caveat (same standard applied to the Hermes/Aurelius block):** all three renders are
AI-generated depictions of trademarked bottles with label defects. The brief requires accurate
labels and forbids AI-generated substitutes for real products. Recommendation: use real merchant
photography of actual stock (photograph the bottles the store sells, straight-on, then we cut the
backgrounds). If the merchant knowingly approves an interim AI render despite the caveat, Tom Ford
Oud Wood is the only one clean enough at display size; Aventus is marginal; Sauvage Elixir is
unusable as-is.

**Catalogue rule:** slides only render for products that exist in the catalogue. Adding these
requires merchant-set prices and availability posture. To avoid inventing commerce data, new
records should launch as waitlist/coming-soon (no purchase action) until the merchant sets real
prices and stock.

## Open merchant decisions

1. Approve Nocturne + Vesper Velvet as launch slides (2-slide orbit) - or hold for three.
2. Supply a correct Aurelius Noir bottle image (unblocks slide 1).
3. Approve the machine-cut transparent bottle assets after review.
4. Approve annotation copy (shipped as DRAFT).
5. Optionally fix the label/name mismatches noted above at the catalogue level.

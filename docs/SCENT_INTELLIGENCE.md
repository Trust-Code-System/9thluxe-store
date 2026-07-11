# Scent Intelligence System

A reusable, catalogue-wide system that turns any perfume's structured fragrance data
(top/heart/base notes, main accords, family, performance) into a rich, accessible, interactive
product experience. It is data-driven: adding a product's notes, or adding an ingredient to the
library, upgrades the storefront automatically with no per-product design work.

## Design principles

- **Never invent notes.** Every visual is built only from the product's real submitted data.
- **Never claim a chemical formulation.** Prominence is always labelled as *perceived scent
  character*, never an ingredient percentage. A tooltip states this wherever a 0-100 score appears.
- **Never misattribute a source.** AI/inferred fields carry `source`, `confidence`, `generatedAt`,
  `method` and `approval`. When confidence is low the admin draft shows **Requires manual review**.
- **Hide gracefully.** Any section with no valid data renders nothing (no empty cards, no fake stats).
- **The purchase path never depends on the visuals.** Composition rendering is additive; if it is
  absent the product and buy controls work unchanged.

## Architecture

### Data layer (`lib/fragrance/`)

| File | Responsibility |
| --- | --- |
| `types.ts` | Framework-agnostic types: `Ingredient`, `ScentComposition`, prominence, provenance, templates. |
| `ingredients.ts` | The **Ingredient Library**: 24 approved, hand-curated ingredients with aliases, misspellings, family, descriptors, colour, related notes, keywords, image provenance and alt text. |
| `normalize.ts` | Ingredient **matching engine**: alias collapsing (oud/oudh/agarwood -> `oud`), misspelling correction (exact + Levenshtein fuzzy), ambiguity + unknown flagging, and admin library search. Never rewrites the submitted text; corrections are suggestions. |
| `art.ts` | Deterministic, in-house **ingredient art** generator (SVG). One art direction, no text, no logos, no network, transparent-cutout variant. This is the "generated fallback" image source. |
| `enrich.ts` | The **enrichment pipeline**: matches notes, assigns perceived prominence, builds the 5-stage timeline, ranks accords, recommends a template, writes cautious copy, infers climate/occasion tags with provenance, and raises an issue queue. Fully deterministic. |

### Storefront (`components/pdp/` + `app/product/[slug]/page.tsx`)

- `scent-composition.tsx` - the visual hero with four templates and the interactive ingredient
  gallery. Chooses the admin-recommended template unless the viewer prefers reduced motion or is on a
  dense mobile layout, where the calm educational grid wins. Every ingredient is a keyboard/touch/
  mouse/screen-reader accessible control; a visually-hidden structured note list guarantees the
  information is never image- or colour-only.
- `ingredient-detail.tsx` - focus-trapped dialog: scent character, role in this perfume, related
  notes, exploration link, layering idea.
- `ingredient-art.tsx` - renders house art for a note (neutral disc for unknown notes).
- `accord-prominence.tsx` - accessible accord bars with the perceived-prominence disclaimer popover.
- `scent-timeline.tsx` - 5-stage development timeline (opening -> late dry-down) with the
  "varies by skin, clothing, climate, application" caveat.

`loadPdpData` (`lib/pdp/loader.ts`) attaches a `composition: ScentComposition | null` to the product
view model, built from the product's real note fields.

### Admin (`app/admin/products/[id]/edit` + `app/api/admin/scent-story/route.ts`)

The product editor embeds `components/admin/scent-story-composer.tsx`:

1. Enter top/heart/base notes; reorder; move notes between tiers; live match status per note.
2. Search the ingredient library and insert entries into a chosen tier.
3. Enter or accept suggested main accords; set family, moods, season, climate, time of day, occasion,
   and an editable editorial description.
4. **Generate Scent Story** -> `POST /api/admin/scent-story` runs the enrichment pipeline and returns
   a reviewable draft (matched ingredients, prominence, timeline, template recommendation, issues,
   suggested accords). It does **not** publish.
5. Preview desktop and mobile; pick any of the four templates or accept the recommendation.
6. **Save as draft** (`publishStatus = DRAFT`) or **Publish** (`publishStatus = PUBLISHED`).

## Visual templates

1. **Vertical note** - ingredients stacked above the real bottle with connectors.
2. **Ingredient environment** - bottle centred, ingredients surrounding by tier (woody/amber/gourmand).
3. **Accord spotlight** - cinematic, the 3-5 dominant accords lead (hero/campaign).
4. **Educational grid** - clean per-ingredient cards; the mobile and reduced-motion default.

## Ingredient imagery and provenance

Priority: approved internal library asset -> licensed asset -> generated house art. Every image
carries `IngredientImageMeta` (`provenance`, `licence`, `sourceNote`, `approval`, `lastReviewed`).
The seeded library uses `generated` house SVG art (`house-svg-v1`). The **real uploaded bottle image
is always used** for the product; AI never redraws bottles, labels or packaging.

## Accessibility (WCAG 2.2 AA)

- Text alternative for every visual note (visible labels + a screen-reader-only tiered note list).
- Full keyboard operation, visible focus rings, focus-trapped dialogs, aria-labels on all controls.
- No information by colour alone (rank + label text everywhere colour is used).
- Reduced-motion honoured (final visible state, no hidden-content trap; calm grid template).
- No horizontal overflow on mobile; dense tiers become contained swipeable rows.

## Performance

- Ingredient art is tiny inline SVG (data URI), lazy-loaded, transform/opacity motion only.
- Below-the-fold PDP islands remain code-split; note text is server-rendered.
- No WebGL; the composition degrades to the grid, and the purchase path never depends on it.

## Optional AI enrichment (credential-gated, NOT required)

The system ships fully functional with **zero external credentials**; all enrichment above is
deterministic (`method: "rule-based:v1"`). An optional AI provider can later enhance copy, suggest
accords, or generate photographic ingredient imagery. If added, it must keep the same guarantees:
notes are never invented, output is saved as a reviewable draft with `source: "ai_model"` +
confidence, and low-confidence output shows **Requires manual review**.

### Missing external API credentials (document only; none required to run)

| Capability | Env var(s) | Status | Effect if absent |
| --- | --- | --- | --- |
| AI copy / accord suggestion (optional upgrade) | `AI_PROVIDER`, `AI_API_KEY` (or existing provider config in `lib/ai/*`) | Not wired in this change | Deterministic rule-based enrichment is used. No degradation of the shipped feature. |
| AI / licensed photographic ingredient imagery (optional upgrade) | e.g. `INGREDIENT_IMAGE_PROVIDER`, `INGREDIENT_IMAGE_API_KEY` | Not configured | House-generated SVG art is used (recorded as `generated`). |

No new required environment variables are introduced by this feature.

## Persisted vs. derived

The composition is **derived** from the product's real note columns
(`notesTop/notesHeart/notesBase`, `mainAccords`, `fragranceFamily`, `olfactoryDesc`, `moodTags`,
`season`, `climate`, `timeOfDay`, `occasion`) plus `publishStatus`, all of which already exist in the
Prisma schema.

### Template persistence (implemented, resilient)

The admin's chosen visual template is persisted per product and honoured on the storefront (falling
back to the deterministic recommendation when unset). To keep the shared/gated Prisma Postgres safe,
this is done **without a Prisma-model change**:

- The value lives in an additive, nullable `Product."scentTemplate"` column, applied idempotently by
  `lib/fragrance/template-store.ts:ensureScentTemplateColumn()` (single `ADD COLUMN IF NOT EXISTS`,
  never a broad `db push`). SQL of record: `prisma/sql/2026_add_scent_template.sql`.
- It is read/written via targeted raw SQL wrapped in try/catch, so product reads **never break** in
  an environment where the column has not been applied yet; the storefront simply uses the
  recommended template. This is intentionally kept out of the Prisma model to avoid coupling every
  default select to the column.
- Flow: composer hidden input `scentTemplate` -> edit-page server action -> `setProductTemplate` ->
  `loadPdpData` reads it via `getProductTemplate` -> `ScentComposition template=...`.

## Tests

- `tests/fragrance/normalize.test.ts` - normalization, aliases, misspellings, fuzzy, ambiguity,
  unknown, library search, library integrity.
- `tests/fragrance/enrich.test.ts` - 3-note and 20+-note perfumes, missing accords, unknown/misspelled
  notes, empty product, climate/occasion inference + provenance, prominence labels, art generator.

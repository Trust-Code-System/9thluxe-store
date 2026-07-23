# FÁDÉ fusion hero sequence handoff

Date: 2026-07-13

## Status

The fusion sequence is implemented as an approval-gated prototype. It is not active on the public homepage.

Mancera Intense Cedrat Boise is the recommended external editorial reference because its official notes most closely cover the combined character of bright fruit, citrus, dry woods, spice, oud, sandalwood and warm amber or vanilla depth. The full comparison is in `docs/HERO_FUSION_FRAGRANCE_RESEARCH.md`.

The researched configuration remains `DRAFT`, disabled and without bottle assets. This is intentional. The existing separated Creed Aventus and Tom Ford Oud Wood composition remains the production hero.

## Sequence architecture

When an approved configuration exists and the `hero_fusion` feature flag is enabled, the scene runs once:

1. The current Creed Aventus and Tom Ford Oud Wood scene appears with its protected center gutter.
2. Each ingredient zone gathers toward its own bottle.
3. The left and right perfume zones withdraw independently in opposite directions.
4. The approved fusion bottle descends and lands at the center.
5. The approved cap cutout lifts or twists according to configuration.
6. The atomizer depresses four times.
7. Four lightweight SVG mist paths reveal `F`, `Á`, `D` and `È` as crisp DOM text.
8. The bottle exits downward while the complete `FÁDÉ` mark remains.
9. The final frame holds without replaying the full sequence.

The implementation uses CSS transforms, opacity, SVG strokes and one small client controller. It adds no dependency, canvas renderer, fluid simulation or Three.js scene.

## Playback safety

- `IntersectionObserver` pauses the timeline outside the viewport.
- The Page Visibility API pauses the timeline when the tab is hidden.
- The sequence is non-looping and consumes no animation work after its final frame.
- Mobile removes the second impact ring and secondary mist thread.
- Reduced motion skips the source withdrawal, landing, cap and spray motion. It shows the approved bottle and complete `FÁDÉ` mark immediately.
- Existing shop and fragrance-finder actions remain outside the animation layer and stay available throughout.

## Approval gate

The homepage renders the fusion scene only when all gates pass:

1. `hero_fusion` is present in `FEATURE_FLAGS`.
2. The fusion record has `approvalStatus: "APPROVED"`.
3. The record has `enabled: true`.
4. Asset rights are `MERCHANT_OWNED`, `LICENSED` or `OFFICIAL_APPROVED`.
5. Both bottle-body and cap cutouts resolve to local `.avif` or `.webp` files under `/public/hero/fusion`.
6. The record contains verified notes, matching reasons and a catalogue product ID or official external source.

If any gate fails, the permanent two-perfume hero renders. Enabling the flag alone cannot expose the DRAFT candidate.

## Required merchant assets

Provide two aligned transparent files:

- `/public/hero/fusion/mancera-intense-cedrat-boise-bottle.webp` or `.avif`
- `/public/hero/fusion/mancera-intense-cedrat-boise-cap.webp` or `.avif`

The body file should show the real bottle with its cap removed. The cap file should contain only the real cap at a matching scale and angle. Preserve the label, proportions and original product appearance. Do not use Pinterest, a scraped reseller image or an AI recreation.

Before approval, confirm:

- commercial image rights
- correct bottle and cap construction
- transparent edges at desktop and mobile sizes
- readable label at the final hero scale
- no colour or shape changes that misrepresent the product

## Activation

After assets and rights are approved:

1. Add both files under `public/hero/fusion`.
2. Update `FUSION_HERO_FRAGRANCE` in `lib/hero/fusion-config.ts` with the two local asset IDs.
3. Set the correct `capMotion` after checking the real bottle.
4. Set the confirmed asset rights value.
5. Change `approvalStatus` to `APPROVED` and `enabled` to `true`.
6. Run visual tests at 320px, 360px, 390px, 430px and desktop.
7. Enable `hero_fusion` in `FEATURE_FLAGS` only after sign-off.

Remove `hero_fusion`, or add `!hero_fusion`, to return immediately to the original permanent hero.

## Files

- `lib/hero/fusion-config.ts`: typed record and public approval guard
- `components/home/hero/permanent/fusion-hero-sequence.tsx`: source transition, landing, cap, four sprays and final wordmark
- `components/home/hero/permanent/permanent-drop-scene.tsx`: reusable source scene with decorative mode
- `components/home/hero/permanent/permanent-hero-section.tsx`: fusion, cinematic and permanent fallback precedence
- `app/globals.css`: non-looping timeline, mobile simplification and reduced-motion frame
- `tests/hero/fusion.test.ts`: approval-gate and four-spray contract coverage

## Truthfulness rule

Use only “closest to the combined scent profile” or equivalent editorial language. Never state or imply that physically mixing Creed Aventus and Tom Ford Oud Wood produces Mancera Intense Cedrat Boise.

# FÁDÉ homepage hero composition and cinematic prototype handoff

Date: 2026-07-13

## Status

The permanent two-perfume hero has been structurally corrected. Creed Aventus and Tom Ford Oud Wood now own separate 46% scene regions with an 8% protected center gutter. Ingredient artwork is clipped inside the correct perfume region, so the fruit and wood groups cannot merge in the middle.

The cinematic landing and spray sequence is implemented behind the `hero_cinematic` feature flag. The flag defaults to `false`, so the corrected permanent composition remains the production-safe hero until the merchant approves the featured showcase asset and its usage.

## Production composition

- Left region: Creed Aventus, pineapple, apple and blackcurrant.
- Right region: Tom Ford Oud Wood, cardamom, sandalwood and tonka.
- Each region contains its own bottle, pedestal, impact, ingredient group and caption.
- Mobile keeps the same ownership boundary instead of collapsing both ingredient groups onto one shared canvas.
- The measured visible ingredient gap is approximately 16px at 320px, 18px at 360px, 20px at 390px, 22px at 430px and 36px at 1440px.
- No horizontal overflow was detected at the tested widths.

## Cinematic sequence

The optional sequence is CSS-only and runs once:

1. Tom Ford Oud Wood descends and lands on a restrained pedestal ripple.
2. The top cap lifts and reveals a small atomizer.
3. Four staggered fragrance-mist bursts play.
4. Each burst reveals one letter of `FÁDÉ`.
5. The bottle sinks and dissolves while the complete brand mark holds.
6. The finished brand mark remains as the final state.

The implementation reuses the existing transparent Tom Ford showcase WebP. It does not add a motion library, canvas runtime, 3D renderer or new dependency. Animation is limited to transforms, opacity, blur and a small number of lightweight decorative layers.

## Feature flag

The flag is registered in `lib/config/feature-flags.ts` and is off by default.

Preview locally:

```powershell
$env:FEATURE_FLAGS='hero_cinematic'
npm run dev
```

Enable alongside other flags by adding `hero_cinematic` to the comma-separated `FEATURE_FLAGS` environment value. Remove it, or add `!hero_cinematic`, to return immediately to the permanent composition.

## Reduced motion and fallback

With `prefers-reduced-motion: reduce`:

- the falling bottle is not shown;
- the cap does not move;
- spray bursts do not play;
- the corrected two-perfume scene is shown without animation;
- both ingredient groups remain visible and separated;
- a static `FÁDÉ` mark remains visible;
- all hero commerce actions remain available.

If the cinematic flag is disabled, every user receives the corrected permanent scene directly.

## Asset and approval requirement

The Tom Ford bottle is a permanent showcase visual and is not connected to catalogue inventory or checkout. Before enabling `hero_cinematic` in production, the merchant should confirm:

1. The existing Tom Ford Oud Wood cutout is approved as the featured hero visual.
2. The image source and brand usage are cleared for commercial display.
3. The showcase remains intentionally decoupled from product stock and pricing.

If any of these approvals are withheld, keep the flag off. The corrected permanent hero remains complete and production-safe.

## Verification

Added coverage:

- `tests/e2e/permanent-hero-presentation.spec.ts` checks 320px, 360px, 390px and 430px ingredient separation, center gutter, labels, bottle visibility, reduced motion and horizontal overflow.
- `tests/hero/cinematic.test.ts` checks exactly four spray beats, the correct `FÁDÉ` spelling and the approved in-repo bottle asset reference.

The deployment baseline at `https://9thluxe-store-two.vercel.app` was captured before implementation in desktop and mobile dark and light themes. The baseline had no horizontal overflow, no console errors and zero measured layout shift. A cold desktop run measured approximately 2.87 seconds LCP, while the mobile run measured approximately 1.0 second LCP. Because the optional sequence adds presentation work and still needs asset approval, it remains disabled by default.

The optimized local production preview of the flagged cinematic variant was measured at 390px. It loaded one hero asset, transferred approximately 514KB for the whole page, produced zero layout shift and no console errors, and had no animation frames slower than 32ms. LCP measured approximately 1.27 seconds normally and 1.57 seconds with 4x CPU throttling.

# FÁDÉ fusion hero fragrance research

Date: 2026-07-13

## Decision

**Recommended fragrance:** Mancera Intense Cedrat Boise

**Relationship to FÁDÉ:** External editorial reference. It is not currently sold by FÁDÉ and no stock, price or availability claim may be shown.

**Approval state:** DRAFT and disabled. The recommendation must not appear on the public homepage until the merchant approves the fragrance and supplies or licenses a transparent bottle asset.

**Safe public wording after approval:** “Closest to the combined scent profile” or “Inspired by the meeting of bright fruit and dark woods.”

This is a scent-profile comparison only. It does not claim that combining Creed Aventus and Tom Ford Oud Wood formulas creates Mancera Intense Cedrat Boise.

## Verified source profiles

### Creed Aventus

Creed describes Aventus as dry woods, fresh, citrus and fruity. Its current official pyramid lists:

- Head: Calabrian bergamot, Sicilian lemon and blackcurrant leaf accord
- Heart: pineapple accord, pink pepper and jasmine accord
- Base: birch, patchouli and musk accord

Source: [Creed Aventus official product page](https://creedboutique.com/products/aventus)

### Tom Ford Oud Wood

Tom Ford describes Oud Wood as oud notes, exotic woods and warm amber. Its official product page lists cardamom, pink pepper, patchouli, amber, oud and tonka bean as key notes, and describes rosewood, sandalwood and vetiver in the composition.

Source: [Tom Ford Oud Wood official product page](https://www.tomfordbeauty.com/products/oud-wood-eau-de-parfum)

## Combined target profile

The comparison target is a balanced character with:

- bright fruit, especially pineapple, blackcurrant or apple
- citrus freshness
- smoky, leathery or dry woods
- pepper or warm spice
- oud character
- sandalwood
- amber, tonka or vanilla warmth

These are qualitative profile dimensions, not formula percentages.

## FÁDÉ catalogue review

The live catalogue was queried on 2026-07-13.

| Product | Relevant verified catalogue notes | Match decision |
| --- | --- | --- |
| Nocturne Eau de Parfum | Bergamot, oud, amber, vanilla | Covers citrus, oud and warmth, but lacks the target fruit, spice, sandalwood and dry-wood structure |
| Aurelius Noir Eau de Toilette | Lemon, bergamot, cedar, vetiver | Covers citrus and dry woods, but lacks fruit, spice, oud, sandalwood and amber or tonka warmth |
| Vesper Velvet Eau de Parfum | Pink pepper, rose, patchouli | Covers spice and one dark-earthy facet, but lacks the rest of the target profile |

Creed Aventus, Tom Ford Oud Wood and Dior Sauvage Elixir exist as DRAFT catalogue records with no public product images. They are not eligible catalogue matches and are not treated as available stock.

**Catalogue conclusion:** no current FÁDÉ product is a credible complete match.

## External candidate comparison

| Candidate | Fruit | Citrus | Dry or smoky woods | Spice | Oud | Sandalwood | Amber, tonka or vanilla warmth | Overall balance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Mancera Intense Cedrat Boise** | Blackcurrant | Sicilian citrus | Patchouli, leather, oakmoss | Warm spices | Cambodian oud | White sandalwood | Ambergris and vanilla | Best coverage of every target dimension |
| Nishane Hacivat Oud | Pineapple | Citrus | Vetiver, patchouli, olibanum | Pink and black pepper | Oud | Not listed | Vanilla | Excellent bright-fruit and oud bridge, but no verified sandalwood or amber note |
| Xerjoff Alexandria II | Apple | Not listed | Rosewood and cedarwood | Cinnamon | Laotian oud | Sandalwood | Amber and vanilla | Excellent warm woody profile, but lacks verified citrus freshness |
| Mancera Aoud Lemon Mint | Almond rather than bright fruit | Sicilian lemon | Leather, patchouli, vetiver | Coriander and black pepper | Oud | Not listed | Amber and vanilla | Strong fresh oud option, but weaker fruit character and no verified sandalwood |

Official sources:

- [Mancera Intense Cedrat Boise official product page](https://manceraparfums.com/esp/es/amaderado/101-intense-cedrat-boise.html)
- [Nishane Hacivat Oud official product page](https://nishane.com/product/hacivat-oud/)
- [Xerjoff Alexandria II official product page](https://www.xerjoff.com/en-as/products/alexandria-ll-parfum)
- [Mancera Aoud Lemon Mint official product page](https://manceraparfums.com/ita/en/fruity/97-aoud-lemon-mint.html)

## Why Intense Cedrat Boise is the closest profile

The official Mancera pyramid lists Sicilian citrus, warm spices and blackcurrant at the top; patchouli, leather, jasmine, Cambodian oud and white sandalwood at the heart; and ambergris, white musk, vanilla and oakmoss at the base.

That structure connects Aventus-like blackcurrant and citrus brightness with Oud Wood-like spice, oud, sandalwood and warm depth without suggesting a literal formula merge. Leather, patchouli and oakmoss provide a dry, dark transition between those poles. No other reviewed candidate covers all target dimensions using only its officially listed notes.

## Bottle asset and construction status

- No Mancera Intense Cedrat Boise asset exists in the repository.
- No merchant-owned or licensed transparent cutout has been supplied.
- Images on the official product page are research references only and are not cleared for reuse in the FÁDÉ hero.
- Pinterest and other scraped imagery are prohibited.
- The final transparent AVIF or WebP must preserve the real bottle proportions, label and cap.
- Cap movement must be matched to the exact approved bottle asset before activation.

## Implementation gate

The fusion configuration must remain:

- `catalogueStatus: "EXTERNAL_REFERENCE"`
- `approvalStatus: "DRAFT"`
- `enabled: false`
- without a public bottle asset

The homepage may render the fusion sequence only when all of these are true:

1. The merchant changes the configuration to `APPROVED`.
2. `enabled` is `true`.
3. A local approved transparent bottle asset ID resolves successfully.
4. The `hero_fusion` feature flag is enabled.

Until then, the existing separated two-perfume hero is the production fallback.

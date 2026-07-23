import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { FusionHeroSequence } from "@/components/home/hero/permanent/fusion-hero-sequence"
import {
  FUSION_HERO_FRAGRANCE,
  getApprovedFusionHeroFragrance,
  isApprovedFusionHeroFragrance,
  type FusionHeroFragrance,
} from "@/lib/hero/fusion-config"

const approvedFixture: FusionHeroFragrance = {
  ...FUSION_HERO_FRAGRANCE,
  approvedBottleAssetId: "/hero/fusion/test-bottle.webp",
  approvedCapAssetId: "/hero/fusion/test-cap.webp",
  assetRights: "MERCHANT_OWNED",
  capMotion: "LIFT",
  approvalStatus: "APPROVED",
  enabled: true,
}

describe("fusion hero approval gate", () => {
  it("keeps the researched recommendation disabled until merchant and asset approval", () => {
    expect(FUSION_HERO_FRAGRANCE.approvalStatus).toBe("DRAFT")
    expect(FUSION_HERO_FRAGRANCE.enabled).toBe(false)
    expect(FUSION_HERO_FRAGRANCE.approvedBottleAssetId).toBeNull()
    expect(getApprovedFusionHeroFragrance()).toBeNull()
  })

  it("accepts only explicitly approved local transparent assets", () => {
    expect(isApprovedFusionHeroFragrance(approvedFixture)).toBe(true)
    expect(
      isApprovedFusionHeroFragrance({
        ...approvedFixture,
        approvedBottleAssetId: "https://example.com/random-product.png",
      }),
    ).toBe(false)
    expect(
      isApprovedFusionHeroFragrance({
        ...approvedFixture,
        assetRights: "PENDING",
      }),
    ).toBe(false)
  })
})

describe("FusionHeroSequence", () => {
  it("keeps both source zones separate and renders four precise spray beats", () => {
    if (!isApprovedFusionHeroFragrance(approvedFixture)) {
      throw new Error("Approved fusion test fixture failed validation")
    }

    const markup = renderToStaticMarkup(
      createElement(FusionHeroSequence, { fragrance: approvedFixture }),
    )

    expect(markup).toContain('data-perfume-zone="aventus"')
    expect(markup).toContain('data-perfume-zone="oud-wood"')
    expect(markup.match(/data-fusion-spray=/g)).toHaveLength(4)
    expect(markup.match(/data-fusion-atomizer-press=/g)).toHaveLength(4)
    expect(markup).toContain('data-fusion-brand="FÁDÉ"')
    expect(markup).toContain('data-fusion-letter="Á"')
    expect(markup).toContain('data-fusion-letter="É"')
    expect(markup).toContain("Closest to the combined scent profile")
  })
})

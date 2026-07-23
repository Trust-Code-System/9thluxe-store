export type FusionCatalogueStatus =
  | "IN_STOCK"
  | "PREORDER"
  | "COMING_SOON"
  | "EXTERNAL_REFERENCE"

export type FusionApprovalStatus = "DRAFT" | "APPROVED" | "REJECTED"
export type FusionAssetRights =
  | "PENDING"
  | "MERCHANT_OWNED"
  | "LICENSED"
  | "OFFICIAL_APPROVED"

export type FusionCapMotion = "LIFT" | "TWIST_LIFT"

export type FusionHeroFragrance = {
  productId?: string
  externalReference?: {
    brand: string
    name: string
    sourceUrls: string[]
  }
  /** Transparent bottle body with the cap removed. Must live under /public/hero/fusion. */
  approvedBottleAssetId: string | null
  /** Transparent cap cutout aligned to the approved bottle body. */
  approvedCapAssetId: string | null
  assetRights: FusionAssetRights
  capMotion: FusionCapMotion | null
  verifiedNotes: string[]
  matchingReasons: string[]
  catalogueStatus: FusionCatalogueStatus
  approvalStatus: FusionApprovalStatus
  enabled: boolean
}

export type ApprovedFusionHeroFragrance = FusionHeroFragrance & {
  approvedBottleAssetId: string
  approvedCapAssetId: string
  assetRights: Exclude<FusionAssetRights, "PENDING">
  capMotion: FusionCapMotion
  approvalStatus: "APPROVED"
  enabled: true
}

/**
 * Research recommendation only. This cannot render publicly until the merchant
 * approves the fragrance and provides cleared, split bottle and cap cutouts.
 */
export const FUSION_HERO_FRAGRANCE: FusionHeroFragrance = {
  externalReference: {
    brand: "Mancera",
    name: "Intense Cedrat Boise",
    sourceUrls: [
      "https://manceraparfums.com/esp/es/amaderado/101-intense-cedrat-boise.html",
    ],
  },
  approvedBottleAssetId: null,
  approvedCapAssetId: null,
  assetRights: "PENDING",
  capMotion: null,
  verifiedNotes: [
    "Sicilian citrus",
    "warm spices",
    "blackcurrant",
    "patchouli",
    "leather",
    "Cambodian oud",
    "white sandalwood",
    "ambergris",
    "vanilla",
    "oakmoss",
  ],
  matchingReasons: [
    "Blackcurrant and Sicilian citrus provide the bright opening.",
    "Warm spices, leather and patchouli bridge the profile into dry woods.",
    "Cambodian oud and white sandalwood provide the dark wood character.",
    "Ambergris, vanilla and oakmoss give the base warmth and structure.",
  ],
  catalogueStatus: "EXTERNAL_REFERENCE",
  approvalStatus: "DRAFT",
  enabled: false,
}

function isLocalApprovedAsset(assetId: string | null): assetId is string {
  return Boolean(
    assetId &&
      /^\/hero\/fusion\/[a-z0-9-]+\.(?:avif|webp)$/i.test(assetId),
  )
}

export function isApprovedFusionHeroFragrance(
  fragrance: FusionHeroFragrance,
): fragrance is ApprovedFusionHeroFragrance {
  return Boolean(
    fragrance.enabled &&
      fragrance.approvalStatus === "APPROVED" &&
      fragrance.assetRights !== "PENDING" &&
      fragrance.capMotion &&
      isLocalApprovedAsset(fragrance.approvedBottleAssetId) &&
      isLocalApprovedAsset(fragrance.approvedCapAssetId) &&
      fragrance.verifiedNotes.length > 0 &&
      fragrance.matchingReasons.length > 0 &&
      (fragrance.productId || fragrance.externalReference?.sourceUrls.length),
  )
}

export function getApprovedFusionHeroFragrance(): ApprovedFusionHeroFragrance | null {
  return isApprovedFusionHeroFragrance(FUSION_HERO_FRAGRANCE)
    ? FUSION_HERO_FRAGRANCE
    : null
}

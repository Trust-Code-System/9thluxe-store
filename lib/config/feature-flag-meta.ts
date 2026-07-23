// lib/config/feature-flag-meta.ts
// Presentation metadata for the read-only feature-flag cockpit. Pure (type-only import of the flag
// union), so it carries no env dependency and is safe to unit-test. Flags themselves are resolved
// from the FEATURE_FLAGS env var in ./feature-flags.ts; this file only labels and groups them and
// records which ones are owner-controlled (financial / approval-gated) and therefore never exposed
// as an admin toggle.

import type { FeatureFlag } from "./feature-flags"

export type FlagGroup = "commerce" | "ai" | "financial" | "messaging" | "hero" | "discovery"

export interface FlagMeta {
  label: string
  description: string
  group: FlagGroup
  /**
   * True when the flag gates money movement or a surface awaiting explicit owner/asset approval.
   * These stay read-only in the admin UI: they are flipped only via the FEATURE_FLAGS env var by
   * the owner, so no admin can enable a payout or an unapproved hero from the panel.
   */
  ownerControlled: boolean
}

export const GROUP_LABELS: Record<FlagGroup, string> = {
  commerce: "Commerce",
  ai: "AI & concierge",
  financial: "Financial (owner-controlled)",
  messaging: "Messaging",
  hero: "Homepage hero (approval-gated)",
  discovery: "Discovery",
}

export const FLAG_META: Record<FeatureFlag, FlagMeta> = {
  shopify_commerce: {
    label: "Shopify commerce",
    description: "Route commerce reads and cart through Shopify instead of local Postgres.",
    group: "commerce",
    ownerControlled: false,
  },
  agentic_feed: {
    label: "Agentic product feed",
    description: "Expose a machine-readable product feed for AI shopping channels.",
    group: "commerce",
    ownerControlled: false,
  },
  ai_concierge: {
    label: "AI Scent Concierge",
    description: "AI Scent Concierge endpoints.",
    group: "ai",
    ownerControlled: false,
  },
  concierge_v2: {
    label: "Perfume Intelligence V2",
    description: "Perfume Intelligence V2 endpoint and full-screen client.",
    group: "ai",
    ownerControlled: false,
  },
  loyalty_rewards: {
    label: "Loyalty rewards",
    description: "Points redemption (moves value). Stays off until the owner approves.",
    group: "financial",
    ownerControlled: true,
  },
  referral_rewards: {
    label: "Referral rewards",
    description: "Referral payouts (moves value). Stays off until the owner approves.",
    group: "financial",
    ownerControlled: true,
  },
  sample_credits: {
    label: "Sample credits",
    description: "Sample credit redemption. Stays off until priced and approved.",
    group: "financial",
    ownerControlled: true,
  },
  whatsapp_marketing: {
    label: "WhatsApp marketing",
    description: "Promotional WhatsApp. Requires customer consent and provider credentials.",
    group: "messaging",
    ownerControlled: true,
  },
  hero_orbit: {
    label: "Hero orbital carousel",
    description: "Homepage orbital perfume carousel. Off until the merchant approves it.",
    group: "hero",
    ownerControlled: true,
  },
  hero_cinematic: {
    label: "Hero cinematic",
    description: "One-time landing and spray hero. Off pending showcase asset approval.",
    group: "hero",
    ownerControlled: true,
  },
  hero_fusion: {
    label: "Hero fusion sequence",
    description: "Approved fusion fragrance sequence. Off pending fragrance and asset approval.",
    group: "hero",
    ownerControlled: true,
  },
}

/** Metadata for a flag, with a safe fallback for any flag missing from the map. */
export function flagMeta(flag: FeatureFlag): FlagMeta {
  return (
    FLAG_META[flag] ?? {
      label: flag,
      description: "",
      group: "commerce",
      ownerControlled: false,
    }
  )
}

/** Group order for stable rendering in the cockpit. */
export const GROUP_ORDER: FlagGroup[] = [
  "commerce",
  "ai",
  "discovery",
  "messaging",
  "financial",
  "hero",
]

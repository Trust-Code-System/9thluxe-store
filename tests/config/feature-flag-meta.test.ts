import { describe, expect, it } from "vitest"
import {
  FLAG_META,
  GROUP_LABELS,
  GROUP_ORDER,
  flagMeta,
  type FlagGroup,
} from "@/lib/config/feature-flag-meta"

// Keep this list in sync with the FeatureFlag union in lib/config/feature-flags.ts. The Record type
// already forces FLAG_META to cover every flag at compile time; this asserts the count at runtime.
const KNOWN_FLAGS = [
  "shopify_commerce",
  "ai_concierge",
  "concierge_v2",
  "loyalty_rewards",
  "referral_rewards",
  "sample_credits",
  "whatsapp_marketing",
  "agentic_feed",
  "hero_orbit",
  "hero_cinematic",
  "hero_fusion",
] as const

describe("FLAG_META", () => {
  it("covers exactly the known flags", () => {
    expect(Object.keys(FLAG_META).sort()).toEqual([...KNOWN_FLAGS].sort())
  })

  it("marks every financial and hero flag as owner-controlled", () => {
    for (const [flag, meta] of Object.entries(FLAG_META)) {
      if (meta.group === "financial" || meta.group === "hero") {
        expect(meta.ownerControlled, `${flag} should be owner-controlled`).toBe(true)
      }
    }
  })

  it("locks down the specific money-moving flags", () => {
    expect(flagMeta("loyalty_rewards").ownerControlled).toBe(true)
    expect(flagMeta("referral_rewards").ownerControlled).toBe(true)
    expect(flagMeta("sample_credits").ownerControlled).toBe(true)
  })

  it("leaves purely technical flags admin-visible but not owner-locked", () => {
    expect(flagMeta("shopify_commerce").ownerControlled).toBe(false)
    expect(flagMeta("ai_concierge").ownerControlled).toBe(false)
  })

  it("gives every flag a non-empty label", () => {
    for (const meta of Object.values(FLAG_META)) {
      expect(meta.label.length).toBeGreaterThan(0)
    }
  })
})

describe("group ordering + labels", () => {
  it("has a label for every group used by a flag", () => {
    for (const meta of Object.values(FLAG_META)) {
      expect(GROUP_LABELS[meta.group]).toBeTruthy()
    }
  })

  it("orders every group that a flag belongs to", () => {
    const used = new Set<FlagGroup>(Object.values(FLAG_META).map((m) => m.group))
    for (const g of used) {
      expect(GROUP_ORDER).toContain(g)
    }
  })
})

import { describe, expect, it } from "vitest"
import {
  MODERATION_STATUSES,
  MODERATION_TABS,
  availableDecisions,
  normaliseStatus,
} from "@/lib/reviews/moderation"

describe("normaliseStatus", () => {
  it("defaults to PENDING for missing or unknown values", () => {
    expect(normaliseStatus(undefined)).toBe("PENDING")
    expect(normaliseStatus(null)).toBe("PENDING")
    expect(normaliseStatus("")).toBe("PENDING")
    expect(normaliseStatus("bogus")).toBe("PENDING")
  })

  it("accepts valid statuses case-insensitively", () => {
    expect(normaliseStatus("approved")).toBe("APPROVED")
    expect(normaliseStatus("REJECTED")).toBe("REJECTED")
    expect(normaliseStatus("Pending")).toBe("PENDING")
  })
})

describe("availableDecisions", () => {
  it("offers both actions on a pending review", () => {
    expect(availableDecisions("PENDING")).toEqual(["approve", "reject"])
  })

  it("never offers a no-op decision", () => {
    expect(availableDecisions("APPROVED")).toEqual(["reject"])
    expect(availableDecisions("REJECTED")).toEqual(["approve"])
  })
})

describe("tabs / statuses", () => {
  it("has a tab for every status", () => {
    expect(MODERATION_TABS.map((t) => t.value).sort()).toEqual([...MODERATION_STATUSES].sort())
  })
})

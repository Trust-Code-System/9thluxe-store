import { describe, expect, it } from "vitest"
import {
  AUDIT_PAGE_SIZE,
  buildAuditWhere,
  pageCount,
  pageSkip,
  parsePage,
} from "@/lib/audit/filters"

describe("buildAuditWhere", () => {
  it("returns an empty where when no filters are provided", () => {
    expect(buildAuditWhere({})).toEqual({})
  })

  it("drops empty and whitespace-only values", () => {
    expect(buildAuditWhere({ actorId: "", action: "   ", targetType: "\t", targetId: null })).toEqual(
      {},
    )
  })

  it("trims and applies exact-match fields", () => {
    expect(buildAuditWhere({ actorId: " u1 ", targetType: "Story", targetId: " s9 " })).toEqual({
      actorId: "u1",
      targetType: "Story",
      targetId: "s9",
    })
  })

  it("matches action case-insensitively via contains", () => {
    expect(buildAuditWhere({ action: "Publish" })).toEqual({
      action: { contains: "Publish", mode: "insensitive" },
    })
  })
})

describe("parsePage", () => {
  it("defaults to 1 for missing or invalid input", () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage(null)).toBe(1)
    expect(parsePage("")).toBe(1)
    expect(parsePage("abc")).toBe(1)
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-4")).toBe(1)
  })

  it("parses valid page numbers", () => {
    expect(parsePage("3")).toBe(3)
    expect(parsePage("12")).toBe(12)
  })
})

describe("pageSkip / pageCount", () => {
  it("computes skip from a 1-based page", () => {
    expect(pageSkip(1)).toBe(0)
    expect(pageSkip(2)).toBe(AUDIT_PAGE_SIZE)
    expect(pageSkip(2, 10)).toBe(10)
    expect(pageSkip(0)).toBe(0)
  })

  it("computes at least one page", () => {
    expect(pageCount(0)).toBe(1)
    expect(pageCount(1)).toBe(1)
    expect(pageCount(AUDIT_PAGE_SIZE)).toBe(1)
    expect(pageCount(AUDIT_PAGE_SIZE + 1)).toBe(2)
    expect(pageCount(25, 10)).toBe(3)
  })
})

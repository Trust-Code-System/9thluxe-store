import { describe, it, expect } from "vitest"
import {
  validateSetting,
  validateSettingsPatch,
  defaultSettings,
  SETTINGS_BY_KEY,
} from "@/lib/settings/schema"
import { isValidHref, isNavLocation, DEFAULT_NAV } from "@/lib/navigation/defaults"

describe("settings validation", () => {
  it("coerces booleans", () => {
    expect(validateSetting("announcementEnabled", "on")).toEqual({ value: true })
    expect(validateSetting("announcementEnabled", "")).toEqual({ value: false })
    expect(validateSetting("announcementEnabled", false)).toEqual({ value: false })
  })

  it("rejects unknown keys", () => {
    const r = validateSetting("DROP TABLE", "x")
    expect("error" in r).toBe(true)
  })

  it("validates urls (http/https/relative only)", () => {
    expect(validateSetting("instagramUrl", "https://x.com")).toEqual({ value: "https://x.com" })
    expect(validateSetting("instagramUrl", "/local")).toEqual({ value: "/local" })
    expect(validateSetting("instagramUrl", "")).toEqual({ value: "" }) // optional
    const bad = validateSetting("instagramUrl", "javascript:alert(1)")
    expect("error" in bad).toBe(true)
  })

  it("validates emails when present", () => {
    expect(validateSetting("contactEmail", "a@b.co")).toEqual({ value: "a@b.co" })
    expect(validateSetting("contactEmail", "")).toEqual({ value: "" })
    const bad = validateSetting("contactEmail", "not-an-email")
    expect("error" in bad).toBe(true)
  })

  it("trims text", () => {
    expect(validateSetting("siteName", "  Fade  ")).toEqual({ value: "Fade" })
  })

  it("patch drops unknown keys and stops on first error", () => {
    const ok = validateSettingsPatch({ siteName: "X", bogus: "y" })
    expect(ok).toEqual({ values: { siteName: "X" } })
    const bad = validateSettingsPatch({ contactEmail: "nope" })
    expect("error" in bad).toBe(true)
  })

  it("defaults cover every registered key", () => {
    const defaults = defaultSettings()
    for (const key of Object.keys(SETTINGS_BY_KEY)) {
      expect(key in defaults).toBe(true)
    }
  })
})

describe("navigation helpers", () => {
  it("accepts safe hrefs and rejects unsafe ones", () => {
    expect(isValidHref("/shop")).toBe(true)
    expect(isValidHref("#top")).toBe(true)
    expect(isValidHref("https://x.com")).toBe(true)
    expect(isValidHref("javascript:alert(1)")).toBe(false)
    expect(isValidHref("")).toBe(false)
  })

  it("recognises known locations only", () => {
    expect(isNavLocation("HEADER_PRIMARY")).toBe(true)
    expect(isNavLocation("FOOTER_SHOP")).toBe(true)
    expect(isNavLocation("NONSENSE")).toBe(false)
  })

  it("has defaults for every location with valid hrefs", () => {
    for (const items of Object.values(DEFAULT_NAV)) {
      expect(items.length).toBeGreaterThan(0)
      for (const item of items) {
        expect(item.label).toBeTruthy()
        expect(isValidHref(item.href)).toBe(true)
      }
    }
  })
})

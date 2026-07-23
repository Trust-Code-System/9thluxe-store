import { describe, it, expect } from "vitest"
import {
  resolveRole,
  hasCapability,
  capabilitiesFor,
  capabilityForPath,
  canAccessPath,
  CAPABILITIES,
} from "@/lib/authz-core"

describe("resolveRole (backwards compatibility)", () => {
  it("treats a legacy ADMIN with no adminRole as SUPER_ADMIN", () => {
    expect(resolveRole({ role: "ADMIN", adminRole: null })).toBe("SUPER_ADMIN")
    expect(resolveRole({ role: "ADMIN" })).toBe("SUPER_ADMIN")
  })
  it("uses the explicit adminRole when present", () => {
    expect(resolveRole({ role: "ADMIN", adminRole: "CONTENT_MANAGER" })).toBe("CONTENT_MANAGER")
  })
  it("returns null for non-admins", () => {
    expect(resolveRole({ role: "USER", adminRole: null })).toBeNull()
    expect(resolveRole(null)).toBeNull()
  })
})

describe("capabilities", () => {
  it("super admin holds every capability", () => {
    const caps = capabilitiesFor("SUPER_ADMIN")
    for (const c of CAPABILITIES) expect(caps).toContain(c)
  })
  it("content manager can manage content but not products or orders", () => {
    expect(hasCapability("CONTENT_MANAGER", "content:manage")).toBe(true)
    expect(hasCapability("CONTENT_MANAGER", "settings:manage")).toBe(true)
    expect(hasCapability("CONTENT_MANAGER", "products:manage")).toBe(false)
    expect(hasCapability("CONTENT_MANAGER", "orders:manage")).toBe(false)
    expect(hasCapability("CONTENT_MANAGER", "users:manage")).toBe(false)
  })
  it("analyst is read-only", () => {
    expect(hasCapability("ANALYST", "content:view")).toBe(true)
    expect(hasCapability("ANALYST", "audit:view")).toBe(true)
    expect(hasCapability("ANALYST", "content:manage")).toBe(false)
    expect(hasCapability("ANALYST", "products:manage")).toBe(false)
    expect(hasCapability("ANALYST", "support:manage")).toBe(false)
  })
  it("order manager handles orders + customers only", () => {
    expect(hasCapability("ORDER_MANAGER", "orders:manage")).toBe(true)
    expect(hasCapability("ORDER_MANAGER", "customers:view")).toBe(true)
    expect(hasCapability("ORDER_MANAGER", "support:manage")).toBe(true)
    expect(hasCapability("ORDER_MANAGER", "content:manage")).toBe(false)
  })
  it("null role holds nothing", () => {
    expect(hasCapability(null, "dashboard:view")).toBe(false)
  })
})

describe("capabilityForPath", () => {
  it("maps admin sections to capabilities", () => {
    expect(capabilityForPath("/admin")).toBe("dashboard:view")
    expect(capabilityForPath("/admin/stories/new")).toBe("content:manage")
    expect(capabilityForPath("/admin/media")).toBe("content:manage")
    expect(capabilityForPath("/admin/settings")).toBe("settings:manage")
    expect(capabilityForPath("/admin/navigation")).toBe("settings:manage")
    expect(capabilityForPath("/admin/products/123/edit")).toBe("products:manage")
    expect(capabilityForPath("/admin/orders")).toBe("orders:manage")
    expect(capabilityForPath("/admin/newsletter")).toBe("marketing:manage")
    expect(capabilityForPath("/admin/enquiries")).toBe("support:manage")
    expect(capabilityForPath("/admin/users")).toBe("users:manage")
  })
  it("falls back to dashboard for unknown admin paths", () => {
    expect(capabilityForPath("/admin/something-new")).toBe("dashboard:view")
  })
})

describe("canAccessPath", () => {
  it("content manager can reach content but not products or users", () => {
    expect(canAccessPath("CONTENT_MANAGER", "/admin/stories")).toBe(true)
    expect(canAccessPath("CONTENT_MANAGER", "/admin/media")).toBe(true)
    expect(canAccessPath("CONTENT_MANAGER", "/admin/products")).toBe(false)
    expect(canAccessPath("CONTENT_MANAGER", "/admin/users")).toBe(false)
  })
  it("super admin can reach everything", () => {
    for (const path of ["/admin", "/admin/products", "/admin/users", "/admin/settings"]) {
      expect(canAccessPath("SUPER_ADMIN", path)).toBe(true)
    }
  })
})

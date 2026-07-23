// lib/authz-core.ts
// Pure capability logic (no server-only imports), so it is safe to unit-test and to import from
// client or edge contexts. The server-side guards live in lib/authz.ts.

import type { AdminRole } from "@prisma/client"

export const CAPABILITIES = [
  "dashboard:view",
  "content:view",
  "content:manage",
  "products:view",
  "products:manage",
  "orders:view",
  "orders:manage",
  "marketing:manage",
  "customers:view",
  "support:manage",
  "settings:manage",
  "users:manage",
  "audit:view",
] as const

export type Capability = (typeof CAPABILITIES)[number]

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  CONTENT_MANAGER: "Content Manager",
  PRODUCT_MANAGER: "Product Manager",
  ORDER_MANAGER: "Order Manager",
  MARKETING_MANAGER: "Marketing Manager",
  ANALYST: "Analyst / Viewer",
}

const ALL: Capability[] = [...CAPABILITIES]

const ROLE_CAPABILITIES: Record<AdminRole, Capability[]> = {
  SUPER_ADMIN: ALL,
  CONTENT_MANAGER: ["dashboard:view", "content:view", "content:manage", "settings:manage"],
  PRODUCT_MANAGER: ["dashboard:view", "products:view", "products:manage", "content:view"],
  ORDER_MANAGER: ["dashboard:view", "orders:view", "orders:manage", "customers:view", "support:manage"],
  MARKETING_MANAGER: ["dashboard:view", "marketing:manage", "content:view", "content:manage"],
  ANALYST: [
    "dashboard:view",
    "content:view",
    "products:view",
    "orders:view",
    "customers:view",
    "audit:view",
  ],
}

/** Resolve the effective admin role. A NULL adminRole on an ADMIN user means SUPER_ADMIN. */
export function resolveRole(
  user: { role: string; adminRole?: AdminRole | null } | null
): AdminRole | null {
  if (!user || user.role !== "ADMIN") return null
  return user.adminRole ?? "SUPER_ADMIN"
}

export function capabilitiesFor(role: AdminRole | null): Capability[] {
  if (!role) return []
  return ROLE_CAPABILITIES[role] ?? []
}

export function hasCapability(role: AdminRole | null, capability: Capability): boolean {
  if (!role) return false
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false
}

/** Map an admin pathname to the capability required to view it. Most specific first. */
export function capabilityForPath(pathname: string): Capability {
  const rules: [string, Capability][] = [
    ["/admin/stories", "content:manage"],
    ["/admin/pages", "content:manage"],
    ["/admin/homepage", "content:manage"],
    ["/admin/media", "content:manage"],
    ["/admin/reviews", "content:manage"],
    ["/admin/settings", "settings:manage"],
    ["/admin/redirects", "settings:manage"],
    ["/admin/email-templates", "settings:manage"],
    ["/admin/feature-flags", "settings:manage"],
    ["/admin/navigation", "settings:manage"],
    ["/admin/audit", "audit:view"],
    ["/admin/products", "products:manage"],
    ["/admin/categories", "products:manage"],
    ["/admin/collections", "products:manage"],
    ["/admin/inventory", "products:manage"],
    ["/admin/orders", "orders:manage"],
    ["/admin/newsletter", "marketing:manage"],
    ["/admin/campaigns", "marketing:manage"],
    ["/admin/customers", "customers:view"],
    ["/admin/enquiries", "support:manage"],
    ["/admin/concierge", "content:manage"],
    ["/admin/users", "users:manage"],
  ]
  for (const [prefix, cap] of rules) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return cap
  }
  return "dashboard:view"
}

/** Whether a role may see a given admin path (used for sidebar filtering). */
export function canAccessPath(role: AdminRole | null, pathname: string): boolean {
  return hasCapability(role, capabilityForPath(pathname))
}

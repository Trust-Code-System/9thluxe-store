// lib/navigation/defaults.ts
// Canonical fallback navigation, mirroring the previously hard-coded arrays in
// components/layout/header.tsx and footer.tsx. Used when no managed items exist yet (or the DB
// is unavailable) and as the source for the navigation seed script.

import type { NavLocation } from "@prisma/client"

export interface NavItemView {
  label: string
  href: string
  newTab: boolean
}

export const NAV_LOCATIONS: { location: NavLocation; label: string }[] = [
  { location: "HEADER_PRIMARY", label: "Header · primary" },
  { location: "HEADER_SECONDARY", label: "Header · secondary" },
  { location: "FOOTER_SHOP", label: "Footer · Shop" },
  { location: "FOOTER_DISCOVER", label: "Footer · Discover" },
  { location: "FOOTER_HELP", label: "Footer · Help" },
  { location: "FOOTER_COMPANY", label: "Footer · Company" },
]

export const DEFAULT_NAV: Record<NavLocation, NavItemView[]> = {
  HEADER_PRIMARY: [
    { label: "Shop", href: "/shop", newTab: false },
    { label: "Collections", href: "/collections", newTab: false },
    { label: "Discover", href: "/find-your-fragrance", newTab: false },
  ],
  HEADER_SECONDARY: [
    { label: "Drops", href: "/drops", newTab: false },
    { label: "Journal", href: "/journal", newTab: false },
    { label: "Concierge", href: "/concierge", newTab: false },
  ],
  FOOTER_SHOP: [
    { label: "All perfumes", href: "/shop", newTab: false },
    { label: "Collections", href: "/collections", newTab: false },
    { label: "Limited drops", href: "/drops", newTab: false },
    { label: "New arrivals", href: "/shop?sort=newest", newTab: false },
  ],
  FOOTER_DISCOVER: [
    { label: "Find your fragrance", href: "/find-your-fragrance", newTab: false },
    { label: "Scent discovery", href: "/discovery", newTab: false },
    { label: "Concierge", href: "/concierge", newTab: false },
    { label: "The Journal", href: "/journal", newTab: false },
  ],
  FOOTER_HELP: [
    { label: "FAQ", href: "/help/faq", newTab: false },
    { label: "Contact us", href: "/help/contact", newTab: false },
    { label: "Returns & exchanges", href: "/help/returns", newTab: false },
    { label: "Shipping", href: "/help/shipping", newTab: false },
  ],
  FOOTER_COMPANY: [
    { label: "About Fádé", href: "/about", newTab: false },
    { label: "Privacy policy", href: "/privacy", newTab: false },
    { label: "Terms of service", href: "/terms", newTab: false },
    { label: "My account", href: "/account", newTab: false },
  ],
}

const KNOWN_LOCATIONS = new Set<NavLocation>(NAV_LOCATIONS.map((l) => l.location))
export function isNavLocation(value: string): value is NavLocation {
  return KNOWN_LOCATIONS.has(value as NavLocation)
}

/** Only http(s) and site-relative hrefs are allowed. */
export function isValidHref(href: string): boolean {
  if (typeof href !== "string" || href.length === 0) return false
  if (href.startsWith("/") || href.startsWith("#")) return true
  try {
    const u = new URL(href)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

// lib/navigation/service.ts
// Read + write access to managed navigation. Public reads fall back to DEFAULT_NAV when no
// managed items exist or the DB is unavailable.

import { cache } from "react"
import type { NavLocation } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { DEFAULT_NAV, NAV_LOCATIONS, isValidHref, type NavItemView } from "./defaults"

export type NavigationMap = Record<NavLocation, NavItemView[]>

/**
 * Public navigation: visible items per location, ordered. Falls back to DEFAULT_NAV per location
 * when that location has no managed items. Cached per request.
 */
export const getNavigation = cache(async (): Promise<NavigationMap> => {
  const map = {} as NavigationMap
  for (const { location } of NAV_LOCATIONS) map[location] = DEFAULT_NAV[location]

  try {
    const rows = await prisma.navigationItem.findMany({
      where: { visible: true },
      orderBy: [{ location: "asc" }, { position: "asc" }],
    })
    const byLocation = new Map<NavLocation, NavItemView[]>()
    for (const row of rows) {
      const list = byLocation.get(row.location) ?? []
      list.push({ label: row.label, href: row.href, newTab: row.newTab })
      byLocation.set(row.location, list)
    }
    for (const [location, items] of byLocation) {
      if (items.length > 0) map[location] = items
    }
  } catch {
    // DB unavailable: defaults already in place.
  }
  return map
})

/** Admin view: every item (incl. hidden) grouped by location. */
export async function getNavigationForAdmin(): Promise<
  Record<NavLocation, { id: string; label: string; href: string; newTab: boolean; visible: boolean; position: number }[]>
> {
  const map = {} as Record<NavLocation, any[]>
  for (const { location } of NAV_LOCATIONS) map[location] = []
  try {
    const rows = await prisma.navigationItem.findMany({
      orderBy: [{ location: "asc" }, { position: "asc" }],
    })
    for (const row of rows) {
      map[row.location].push({
        id: row.id,
        label: row.label,
        href: row.href,
        newTab: row.newTab,
        visible: row.visible,
        position: row.position,
      })
    }
  } catch {
    // return empty groups
  }
  return map
}

export class NavigationError extends Error {
  constructor(message: string, public code: "VALIDATION" = "VALIDATION") {
    super(message)
    this.name = "NavigationError"
  }
}

export interface IncomingNavItem {
  label: string
  href: string
  newTab?: boolean
  visible?: boolean
}

/** Replace all items for one location atomically. Validates every item first. */
export async function replaceMenu(
  location: NavLocation,
  items: IncomingNavItem[],
  actor: { actorId: string; actorRole: string }
) {
  const cleaned = items.map((item, i) => {
    const label = typeof item.label === "string" ? item.label.trim() : ""
    const href = typeof item.href === "string" ? item.href.trim() : ""
    if (!label) throw new NavigationError(`Item ${i + 1}: label is required`)
    if (!isValidHref(href)) throw new NavigationError(`Item "${label}": invalid link "${href}"`)
    return {
      location,
      label,
      href,
      newTab: Boolean(item.newTab),
      visible: item.visible !== false,
      position: i,
    }
  })

  await prisma.$transaction([
    prisma.navigationItem.deleteMany({ where: { location } }),
    ...(cleaned.length ? [prisma.navigationItem.createMany({ data: cleaned })] : []),
  ])

  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "navigation.replace",
    targetType: "NavigationItem",
    metadata: { location, count: cleaned.length },
  })

  return cleaned
}

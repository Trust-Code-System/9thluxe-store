"use client"

import * as React from "react"
import type { SettingsValues } from "@/lib/settings/schema"
import type { NavItemView } from "@/lib/navigation/defaults"

export interface SiteChrome {
  settings: SettingsValues
  nav: Record<string, NavItemView[]>
}

const SiteChromeContext = React.createContext<SiteChrome | null>(null)

/**
 * Server-populated site chrome (settings + navigation) shared with the client header, footer and
 * announcement bar. Rendered once at the root so even client-component pages receive it.
 */
export function SiteChromeProvider({
  value,
  children,
}: {
  value: SiteChrome
  children: React.ReactNode
}) {
  return <SiteChromeContext.Provider value={value}>{children}</SiteChromeContext.Provider>
}

export function useSiteChrome(): SiteChrome | null {
  return React.useContext(SiteChromeContext)
}

// lib/settings/service.ts
// Read + write access to typed site settings. Public reads merge stored values over the
// registry defaults and degrade gracefully if the DB is unavailable (e.g. migration not applied).

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import {
  SETTINGS_BY_KEY,
  defaultSettings,
  validateSettingsPatch,
  type SettingsValues,
} from "./schema"

/**
 * The effective settings: registry defaults overlaid with any stored values.
 * Cached per request so multiple components (header, footer, metadata) share one query.
 */
export const getSiteSettings = cache(async (): Promise<SettingsValues> => {
  const values = defaultSettings()
  try {
    const rows = await prisma.siteSetting.findMany()
    for (const row of rows) {
      if (row.key in SETTINGS_BY_KEY) {
        // stored value shape matches the field type (validated on write)
        values[row.key] = row.value as string | boolean
      }
    }
  } catch {
    // DB unavailable: return defaults so the storefront still renders.
  }
  return values
})

export class SettingsError extends Error {
  constructor(message: string, public code: "VALIDATION" = "VALIDATION") {
    super(message)
    this.name = "SettingsError"
  }
}

export async function updateSettings(
  patch: Record<string, unknown>,
  actor: { actorId: string; actorRole: string }
): Promise<SettingsValues> {
  const result = validateSettingsPatch(patch)
  if ("error" in result) throw new SettingsError(result.error)

  const entries = Object.entries(result.values)
  if (entries.length === 0) return getSiteSettings()

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as never, updatedBy: actor.actorId },
        update: { value: value as never, updatedBy: actor.actorId },
      })
    )
  )

  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "settings.update",
    targetType: "SiteSetting",
    metadata: { keys: entries.map(([k]) => k) },
  })

  // Re-read fresh (bypassing the request cache is fine here: new request on next public render).
  const values = defaultSettings()
  const rows = await prisma.siteSetting.findMany()
  for (const row of rows) {
    if (row.key in SETTINGS_BY_KEY) values[row.key] = row.value as string | boolean
  }
  return values
}

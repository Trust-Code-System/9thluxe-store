// lib/homepage/service.ts
// Read + write the homepage layout. Reads merge stored rows with the fixed catalogue so every
// known section always appears (in stored order, else default order). Degrades to the catalogue
// defaults if the DB is unavailable.

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import {
  HOMEPAGE_SECTIONS,
  SECTION_BY_TYPE,
  validateSectionConfig,
  type SectionConfig,
} from "./registry"

export interface HomepageSectionView {
  type: string
  label: string
  visible: boolean
  position: number
  config: SectionConfig // overrides only
}

function catalogueDefaults(): HomepageSectionView[] {
  return HOMEPAGE_SECTIONS.map((s) => ({
    type: s.type,
    label: s.label,
    visible: true,
    position: s.defaultPosition,
    config: {},
  }))
}

/** Ordered, merged homepage layout. Cached per request. */
export const getHomepageLayout = cache(async (): Promise<HomepageSectionView[]> => {
  const base = new Map(catalogueDefaults().map((s) => [s.type, s]))
  try {
    const rows = await prisma.homepageSection.findMany()
    for (const row of rows) {
      if (!SECTION_BY_TYPE[row.type]) continue // ignore stale types
      const entry = base.get(row.type)
      if (!entry) continue
      entry.visible = row.visible
      entry.position = row.position
      entry.config = (row.config ?? {}) as SectionConfig
    }
  } catch {
    // DB unavailable: catalogue defaults already in place.
  }
  return Array.from(base.values()).sort((a, b) => a.position - b.position)
})

export class HomepageError extends Error {
  constructor(message: string, public code: "VALIDATION" = "VALIDATION") {
    super(message)
    this.name = "HomepageError"
  }
}

export interface IncomingSection {
  type: string
  position?: number
  visible?: boolean
  config?: Record<string, unknown>
}

/** Replace the whole layout atomically. Unknown types are rejected; config is validated per type. */
export async function saveHomepageLayout(
  sections: IncomingSection[],
  actor: { actorId: string; actorRole: string }
): Promise<HomepageSectionView[]> {
  if (!Array.isArray(sections)) throw new HomepageError("Invalid payload")

  const cleaned = sections.map((s, i) => {
    if (!SECTION_BY_TYPE[s.type]) throw new HomepageError(`Unknown section: ${s.type}`)
    const result = validateSectionConfig(s.type, s.config)
    if ("error" in result) throw new HomepageError(result.error)
    return {
      type: s.type,
      position: Number.isFinite(s.position) ? Number(s.position) : i,
      visible: s.visible !== false,
      config: result.config,
    }
  })

  await prisma.$transaction(
    cleaned.map((s) =>
      prisma.homepageSection.upsert({
        where: { type: s.type },
        create: {
          type: s.type,
          position: s.position,
          visible: s.visible,
          config: s.config as never,
          updatedBy: actor.actorId,
        },
        update: {
          position: s.position,
          visible: s.visible,
          config: s.config as never,
          updatedBy: actor.actorId,
        },
      })
    )
  )

  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "homepage.save",
    targetType: "HomepageSection",
    metadata: { order: cleaned.map((s) => s.type), hidden: cleaned.filter((s) => !s.visible).map((s) => s.type) },
  })

  const base = new Map(catalogueDefaults().map((s) => [s.type, s]))
  for (const s of cleaned) {
    const entry = base.get(s.type)
    if (entry) {
      entry.visible = s.visible
      entry.position = s.position
      entry.config = s.config
    }
  }
  return Array.from(base.values()).sort((a, b) => a.position - b.position)
}

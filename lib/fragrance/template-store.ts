// lib/fragrance/template-store.ts
// SERVER-ONLY. Persists an admin's chosen visual template for a product.
//
// This deliberately does NOT add `scentTemplate` to the Prisma model. The production database is a
// shared/gated Prisma Postgres instance, and coupling it to Prisma's default selects would break every
// product read in any environment where the column has not yet been applied. Instead the column is
// read/written via targeted raw SQL, wrapped so a missing column degrades gracefully to the
// deterministic template recommendation. Activation is a single additive, idempotent ALTER (see
// `ensureScentTemplateColumn` and prisma/sql/2026_add_scent_template.sql); the feature works with or
// without it.

import "server-only"
import { prisma } from "@/lib/prisma"
import type { TemplateId } from "./types"

const VALID_TEMPLATES: TemplateId[] = [
  "vertical_note",
  "ingredient_environment",
  "accord_spotlight",
  "educational_grid",
]

export function isTemplateId(value: string): value is TemplateId {
  return (VALID_TEMPLATES as string[]).includes(value)
}

/** Read the saved template override, or null when unset / column absent / any error. Never throws. */
export async function getProductTemplate(productId: string): Promise<TemplateId | null> {
  try {
    const rows = await prisma.$queryRaw<{ scentTemplate: string | null }[]>`
      SELECT "scentTemplate" FROM "Product" WHERE "id" = ${productId} LIMIT 1
    `
    const value = rows[0]?.scentTemplate
    return value && isTemplateId(value) ? value : null
  } catch {
    // Column not present in this environment: fall back to the deterministic recommendation.
    return null
  }
}

/** Persist (or clear, with null) the template override. Returns false when storage is unavailable. */
export async function setProductTemplate(productId: string, template: TemplateId | null): Promise<boolean> {
  const value = template && isTemplateId(template) ? template : null
  try {
    await prisma.$executeRaw`
      UPDATE "Product" SET "scentTemplate" = ${value} WHERE "id" = ${productId}
    `
    return true
  } catch {
    return false
  }
}

/**
 * Idempotently add the additive, nullable `scentTemplate` column. Safe to call repeatedly; a no-op
 * once the column exists. Touches only this single column, never a broad schema sync.
 */
export async function ensureScentTemplateColumn(): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "scentTemplate" TEXT')
    return true
  } catch {
    return false
  }
}

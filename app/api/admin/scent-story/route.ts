// app/api/admin/scent-story/route.ts
// Admin-only "Generate Scent Story" endpoint. It runs the deterministic enrichment pipeline over the
// submitted (never pre-cleaned) fragrance data and returns a REVIEWABLE draft: matched ingredients,
// perceived prominence, timeline, template recommendation, cautious copy and an issue queue. It does
// NOT publish anything and it does NOT write to the product; the admin reviews the draft and saves or
// publishes separately. An optional AI provider can be layered on later (see docs/SCENT_INTELLIGENCE.md);
// the endpoint is fully functional with no external credential.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminUser } from "@/lib/admin"
import { hasCapability, resolveRole } from "@/lib/authz-core"
import { enrichComposition } from "@/lib/fragrance/enrich"
import { matchIngredients } from "@/lib/fragrance/normalize"

export const runtime = "nodejs"

const StrList = z.array(z.string()).default([])
const NullableStr = z.string().trim().min(1).nullable().optional().transform((v) => v ?? null)

const BodySchema = z.object({
  top: StrList,
  heart: StrList,
  base: StrList,
  accords: StrList,
  family: NullableStr,
  olfactoryDesc: NullableStr,
  moods: StrList,
  season: NullableStr,
  climate: NullableStr,
  timeOfDay: NullableStr,
  occasion: NullableStr,
})

/**
 * Deterministically suggest main accords from the matched ingredients' families, used only when the
 * admin supplied no accords. This is a SUGGESTION surfaced for review, never silently written.
 */
function suggestAccords(top: string[], heart: string[], base: string[]): string[] {
  const matches = matchIngredients([...top, ...heart, ...base])
  const counts = new Map<string, number>()
  for (const m of matches) {
    if (!m.ingredient) continue
    // Weight by descriptor so the character reflects scent, not just taxonomy.
    for (const d of m.ingredient.descriptors) counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d]) => d)
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 })
    }
    if (!hasCapability(resolveRole(admin), "products:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const composition = enrichComposition({
      top: input.top,
      heart: input.heart,
      base: input.base,
      accords: input.accords,
      family: input.family,
      olfactoryDesc: input.olfactoryDesc,
      moods: input.moods,
      season: input.season,
      climate: input.climate,
      timeOfDay: input.timeOfDay,
      occasion: input.occasion,
    })

    const suggestedAccords =
      input.accords.length === 0 ? suggestAccords(input.top, input.heart, input.base) : []

    return NextResponse.json({
      composition,
      suggestedAccords,
      // Provenance so the UI can be honest about how the draft was produced.
      generatedBy: "rule-based:v1",
      aiAssisted: false,
    })
  } catch (error) {
    console.error("Generate scent story error:", error)
    return NextResponse.json({ error: "Failed to generate scent story" }, { status: 500 })
  }
}

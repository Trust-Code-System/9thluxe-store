// lib/homepage/registry.ts
// Fixed catalogue of homepage sections. Only these types exist; the admin controls order,
// visibility, and copy overrides. Data-bound parts (featured products, fragrance family list,
// hero motion) stay in code. Stored config holds ONLY overrides; an unset field renders the
// component's built-in (rich) default, so the homepage is pixel-identical until edited.

import { isValidHref } from "@/lib/navigation/defaults"

export type FieldType = "text" | "textarea" | "url"

export interface SectionField {
  key: string
  label: string
  type: FieldType
  /** The current built-in copy, shown as a placeholder in the admin form. */
  placeholder: string
}

export interface SectionDef {
  type: string
  label: string
  description: string
  defaultPosition: number
  /** Empty = visibility + order only (no editable copy). */
  fields: SectionField[]
}

export const HOMEPAGE_SECTIONS: SectionDef[] = [
  {
    type: "hero",
    label: "Hero",
    description: "The cinematic hero. Content is driven by the approved featured product.",
    defaultPosition: 0,
    fields: [],
  },
  {
    type: "featured_products",
    label: "Featured products (The Edit)",
    description: "Products are chosen automatically from the catalogue; edit the surrounding copy.",
    defaultPosition: 1,
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "The edit" },
      { key: "title", label: "Title", type: "text", placeholder: "Currently coveted" },
      {
        key: "subtitle",
        label: "Subtitle",
        type: "textarea",
        placeholder: "Hand-picked from the collection: the bottles our clients keep returning to.",
      },
      { key: "viewAllLabel", label: "View-all label", type: "text", placeholder: "View all perfumes" },
      { key: "viewAllHref", label: "View-all link", type: "url", placeholder: "/shop" },
    ],
  },
  {
    type: "fragrance_families",
    label: "Fragrance families",
    description: "The family index. The six families themselves are fixed; edit the header copy.",
    defaultPosition: 2,
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "Index of scents" },
      { key: "title", label: "Title", type: "text", placeholder: "Every perfume belongs to a family." },
      {
        key: "subtitle",
        label: "Subtitle",
        type: "textarea",
        placeholder: "Six characters, six moods. Start from the one that feels like you, or the one you have never dared to wear.",
      },
    ],
  },
  {
    type: "brand_story",
    label: "Brand story (The House)",
    description: "The house manifesto.",
    defaultPosition: 3,
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "The house" },
      { key: "quote", label: "Pull quote", type: "textarea", placeholder: "A fragrance is the only thing you wear that enters a room before you, and stays after you leave." },
      { key: "paragraph1", label: "Paragraph 1", type: "textarea", placeholder: "Fádé began in Lagos with a simple discipline..." },
      { key: "paragraph2", label: "Paragraph 2", type: "textarea", placeholder: "We are not a marketplace. We are a small house with a strong nose..." },
      { key: "ctaLabel", label: "CTA label", type: "text", placeholder: "Read our story" },
      { key: "ctaHref", label: "CTA link", type: "url", placeholder: "/about" },
    ],
  },
  {
    type: "concierge_invitation",
    label: "Concierge invitation",
    description: "Invitation to the Scent Concierge and quiz.",
    defaultPosition: 4,
    fields: [
      { key: "heading", label: "Heading", type: "text", placeholder: "Describe a memory. We'll find the scent." },
      { key: "subtext", label: "Subtext", type: "textarea", placeholder: "A mood, an evening, someone you remember. The Scent Concierge listens and recommends real, in-stock fragrances from our house." },
      { key: "primaryCtaLabel", label: "Primary CTA label", type: "text", placeholder: "Talk to the Concierge" },
      { key: "primaryCtaHref", label: "Primary CTA link", type: "url", placeholder: "/concierge" },
      { key: "secondaryCtaLabel", label: "Secondary CTA label", type: "text", placeholder: "Take the scent quiz" },
      { key: "secondaryCtaHref", label: "Secondary CTA link", type: "url", placeholder: "/find-your-fragrance" },
    ],
  },
]

export const SECTION_BY_TYPE: Record<string, SectionDef> = Object.fromEntries(
  HOMEPAGE_SECTIONS.map((s) => [s.type, s])
)

export function isSectionType(value: string): boolean {
  return value in SECTION_BY_TYPE
}

export type SectionConfig = Record<string, string>

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

/**
 * Validate + clean a config object for a section type. Unknown keys are dropped; empty values are
 * dropped (so the field reverts to its built-in default); url fields must be safe.
 */
export function validateSectionConfig(
  type: string,
  raw: unknown
): { config: SectionConfig } | { error: string } {
  const def = SECTION_BY_TYPE[type]
  if (!def) return { error: `Unknown section: ${type}` }
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const config: SectionConfig = {}
  for (const field of def.fields) {
    const value = field.type === "url"
      ? (typeof input[field.key] === "string" ? (input[field.key] as string).trim() : "")
      : sanitizeText(input[field.key])
    if (!value) continue // empty = revert to default
    if (field.type === "url" && !isValidHref(value)) {
      return { error: `${def.label}: "${field.label}" must be a valid link` }
    }
    config[field.key] = value
  }
  return { config }
}

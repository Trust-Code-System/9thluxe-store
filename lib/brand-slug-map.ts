/**
 * Brand slug helpers.
 *
 * Brand pages resolve dynamically from the brands actually present in the
 * database. The static map below only keeps legacy marketing URLs alive.
 */
export const brandSlugMap: Record<string, string> = {
  "tom-ford": "Tom Ford",
  "creed": "Creed",
  "dior": "Dior",
  "gucci": "Gucci",
  "chanel": "Chanel",
  "prada": "Prada",
  "byredo": "Byredo",
  "jo-malone": "Jo Malone",
}

/** URL-friendly slug for a brand name ("Jo Malone" → "jo-malone"). */
export function slugifyBrand(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (Fádé → Fade)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Resolves a slug against the real brand list from the database first,
 * then the legacy map.
 */
export function resolveBrandFromSlug(
  slug: string,
  dbBrands: string[]
): string | undefined {
  const lower = slug.toLowerCase()
  return (
    dbBrands.find((brand) => slugifyBrand(brand) === lower) ??
    brandSlugMap[lower]
  )
}

/**
 * Gets the brand name from a slug (legacy static map only).
 */
export function getBrandNameFromSlug(slug: string): string | undefined {
  return brandSlugMap[slug.toLowerCase()]
}

/**
 * Gets all valid brand slugs (legacy static map only).
 */
export function getAllBrandSlugs(): string[] {
  return Object.keys(brandSlugMap)
}

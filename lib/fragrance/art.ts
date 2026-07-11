// lib/fragrance/art.ts
// Deterministic, in-house ingredient art. This is the "generated fallback" image source: it renders
// a consistent, brand-safe vector motif for any ingredient from its family + colour, with NO text,
// NO logos, NO third-party imagery and NO external model or network call. Output is an inline SVG (or
// a data URI) with a transparent background, so it is fast, cache-friendly and always available even
// when a licensed photograph is not. Provenance for these assets is recorded as "generated" in the
// ingredient library.

import type { Ingredient, IngredientFamily } from "./types"

/**
 * One simple, abstract glyph per family. Paths are drawn inside a 100x100 viewBox and are purely
 * suggestive (a leaf, a droplet, a flame) rather than literal depictions, keeping a coherent art
 * direction across the whole catalogue. No path spells text or forms a logo.
 */
const FAMILY_GLYPH: Record<IngredientFamily, string> = {
  citrus:
    '<circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 30V70M30 50H70M36 36L64 64M64 36L36 64" stroke="currentColor" stroke-width="2" opacity="0.7"/>',
  floral:
    '<g stroke="currentColor" stroke-width="3" fill="none"><ellipse cx="50" cy="34" rx="9" ry="14"/><ellipse cx="66" cy="50" rx="14" ry="9"/><ellipse cx="50" cy="66" rx="9" ry="14"/><ellipse cx="34" cy="50" rx="14" ry="9"/></g><circle cx="50" cy="50" r="6" fill="currentColor"/>',
  woody:
    '<g stroke="currentColor" stroke-width="3" fill="none"><circle cx="50" cy="50" r="8"/><circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="24"/></g><path d="M50 26V74" stroke="currentColor" stroke-width="2" opacity="0.6"/>',
  amber:
    '<path d="M50 24C40 24 33 34 33 48s7 28 17 28 17-14 17-28S60 24 50 24Z" fill="currentColor" opacity="0.25"/><path d="M50 24C40 24 33 34 33 48s7 28 17 28 17-14 17-28S60 24 50 24Z" fill="none" stroke="currentColor" stroke-width="3"/>',
  spicy:
    '<g stroke="currentColor" stroke-width="3" fill="none"><path d="M50 24L50 76"/><path d="M38 34C46 42 46 58 38 66"/><path d="M62 34C54 42 54 58 62 66"/></g>',
  gourmand:
    '<g stroke="currentColor" stroke-width="3" fill="none"><path d="M30 58C30 44 40 34 50 34s20 10 20 24"/><path d="M28 58H72"/><path d="M42 34C42 28 46 24 50 24"/></g>',
  green:
    '<path d="M50 74C50 50 40 34 26 30 40 34 50 50 50 74Z" fill="currentColor" opacity="0.3"/><path d="M50 74C50 50 60 34 74 30 60 34 50 50 50 74Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 74V40" stroke="currentColor" stroke-width="3"/>',
  fruity:
    '<circle cx="46" cy="54" r="18" fill="currentColor" opacity="0.22"/><circle cx="46" cy="54" r="18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M56 40C58 32 64 28 70 28" fill="none" stroke="currentColor" stroke-width="3"/>',
  aromatic:
    '<g stroke="currentColor" stroke-width="3" fill="none"><path d="M50 24V72"/><path d="M50 40C44 40 38 44 36 52"/><path d="M50 40C56 40 62 44 64 52"/><path d="M50 54C45 54 40 57 38 63"/><path d="M50 54C55 54 60 57 62 63"/></g>',
  animalic:
    '<g stroke="currentColor" stroke-width="3" fill="none"><path d="M30 40C36 30 64 30 70 40"/><path d="M32 40C28 54 36 70 50 70s22-16 18-30"/></g><circle cx="50" cy="52" r="4" fill="currentColor"/>',
  resinous:
    '<path d="M50 22L54 46L50 78L46 46Z" fill="currentColor" opacity="0.25"/><path d="M50 22L54 46L50 78L46 46Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M34 34C42 40 42 56 34 62M66 34C58 40 58 56 66 62" stroke="currentColor" stroke-width="2" opacity="0.6" fill="none"/>',
  aquatic:
    '<g stroke="currentColor" stroke-width="3" fill="none"><path d="M26 44C34 38 42 50 50 44s16-6 24 0"/><path d="M26 56C34 50 42 62 50 56s16-6 24 0"/></g>',
  powdery:
    '<g fill="currentColor"><circle cx="50" cy="50" r="5"/><circle cx="34" cy="40" r="3" opacity="0.7"/><circle cx="66" cy="40" r="3" opacity="0.7"/><circle cx="40" cy="64" r="3" opacity="0.7"/><circle cx="62" cy="62" r="3" opacity="0.7"/><circle cx="50" cy="30" r="2.5" opacity="0.5"/></g>',
  smoky:
    '<g stroke="currentColor" stroke-width="3" fill="none"><path d="M42 72C42 60 58 60 58 48S42 36 42 26"/><path d="M52 70C52 60 64 60 64 50"/></g>',
}

export interface ArtOptions {
  /** Pixel size of the square SVG. Default 160 for desktop, pass ~96 for the mobile variant. */
  size?: number
  /** When true, omits the soft disc backdrop for a cleaner cutout on busy backgrounds. */
  cutout?: boolean
}

/** Deterministic SVG markup for an ingredient. Same input always yields identical output. */
export function ingredientArtSvg(ingredient: Ingredient, opts: ArtOptions = {}): string {
  const size = opts.size ?? 160
  const color = ingredient.color
  const glyph = FAMILY_GLYPH[ingredient.family]
  const gid = `g_${ingredient.id}`
  const defs = opts.cutout
    ? ""
    : `<defs><radialGradient id="${gid}" cx="42%" cy="38%" r="70%">` +
      `<stop offset="0%" stop-color="${color}" stop-opacity="0.32"/>` +
      `<stop offset="100%" stop-color="${color}" stop-opacity="0.06"/>` +
      `</radialGradient></defs>`
  const backdrop = opts.cutout
    ? ""
    : `<circle cx="50" cy="50" r="46" fill="url(#${gid})"/><circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-opacity="0.35" stroke-width="1.5"/>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${escapeAttr(ingredient.alt)}">` +
    defs +
    backdrop +
    `<g color="${color}">${glyph}</g>` +
    `</svg>`
  )
}

/** URL-encoded data URI form, safe to drop straight into an <img src> or CSS background. */
export function ingredientArtDataUri(ingredient: Ingredient, opts: ArtOptions = {}): string {
  const svg = ingredientArtSvg(ingredient, opts)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

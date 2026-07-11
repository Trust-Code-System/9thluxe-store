// lib/layering/rules.ts
// PURE editorial layering rules. Subjective results are presented as guidance, never guarantees.
// The AI layer (in the route) only phrases the editorial output; it does not decide compatibility.

export type Family = 'FLORAL' | 'WOODY' | 'ORIENTAL' | 'FRESH' | 'CITRUS' | 'GOURMAND' | 'SPICY'

export interface LayerInput {
  family: Family | null
  intensity?: string | null // 'subtle' | 'moderate' | 'bold'
  name: string
}

export type Compatibility = 'great' | 'good' | 'experimental'

export interface LayeringAdvice {
  compatibility: Compatibility
  /** Names in the recommended spray order (base-heavier first, lighter on top). */
  sprayOrder: [string, string]
  ratio: string
  warnings: string[]
  note: string
  isGuidance: true
}

// Base "heaviness": heavier families anchor the blend and go on first.
const WEIGHT: Record<Family, number> = {
  ORIENTAL: 5,
  WOODY: 4,
  GOURMAND: 4,
  SPICY: 3,
  FLORAL: 2,
  CITRUS: 1,
  FRESH: 1,
}

// Pairs that layer especially well (order-independent).
const GREAT = new Set(['ORIENTAL|WOODY', 'ORIENTAL|GOURMAND', 'WOODY|FLORAL', 'FRESH|CITRUS', 'FLORAL|GOURMAND', 'WOODY|SPICY'])
// Pairs that tend to clash / muddy.
const DISCOURAGED = new Set(['FRESH|GOURMAND', 'CITRUS|GOURMAND', 'FRESH|ORIENTAL'])

function key(a: Family, b: Family): string {
  return [a, b].sort().join('|')
}

export function evaluateLayering(a: LayerInput, b: LayerInput): LayeringAdvice {
  const fa = a.family
  const fb = b.family

  // Spray order: heavier family first; ties keep input order.
  const first = fa && fb ? (WEIGHT[fa] >= WEIGHT[fb] ? a : b) : a
  const second = first === a ? b : a
  const sprayOrder: [string, string] = [first.name, second.name]

  const warnings: string[] = []
  const bothBold = a.intensity === 'bold' && b.intensity === 'bold'
  if (bothBold) warnings.push('Both are bold, so apply the second fragrance lightly (1 spray) to avoid overwhelming the blend.')

  let compatibility: Compatibility = 'experimental'
  let note = 'An experimental pairing: try it on a blotter or one wrist first.'
  if (fa && fb) {
    const k = key(fa, fb)
    if (fa === fb) {
      compatibility = 'good'
      note = 'Same family: reinforces the theme; expect a richer, deeper version.'
    } else if (GREAT.has(k)) {
      compatibility = 'great'
      note = 'A complementary pairing that tends to bloom well together.'
    } else if (DISCOURAGED.has(k)) {
      compatibility = 'experimental'
      warnings.push('These families can clash, so go light and test before committing.')
      note = 'A tricky pairing; the contrast can read as muddy on some skin.'
    } else {
      compatibility = 'good'
      note = 'A balanced pairing worth trying.'
    }
  }

  const ratio = compatibility === 'great' ? '60/40 (base-heavier first)' : '70/30 (favour the anchor)'

  return { compatibility, sprayOrder, ratio, warnings, note, isGuidance: true }
}

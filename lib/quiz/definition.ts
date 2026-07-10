// lib/quiz/definition.ts
// Versioned Fragrance DNA quiz definition + PURE profile derivation. No sensitive personal
// attributes are inferred — only fragrance preferences. Derivation is deterministic and testable.
import { z } from 'zod'

export const QUIZ_VERSION = 'v1'

export interface QuizOption {
  value: string
  label: string
}
export interface QuizQuestion {
  id: string
  prompt: string
  type: 'single' | 'multi'
  options: QuizOption[]
}

export const QUIZ_V1: { version: string; questions: QuizQuestion[] } = {
  version: QUIZ_VERSION,
  questions: [
    {
      id: 'families',
      prompt: 'Which fragrance families draw you in?',
      type: 'multi',
      options: [
        { value: 'FLORAL', label: 'Floral' },
        { value: 'WOODY', label: 'Woody' },
        { value: 'ORIENTAL', label: 'Oriental / Amber' },
        { value: 'FRESH', label: 'Fresh / Aquatic' },
        { value: 'CITRUS', label: 'Citrus' },
        { value: 'GOURMAND', label: 'Gourmand / Sweet' },
        { value: 'SPICY', label: 'Spicy' },
      ],
    },
    {
      id: 'intensity',
      prompt: 'How present do you like a scent to be?',
      type: 'single',
      options: [
        { value: 'subtle', label: 'Subtle / skin scent' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'bold', label: 'Bold / statement' },
      ],
    },
    {
      id: 'loveNotes',
      prompt: 'Pick notes you love.',
      type: 'multi',
      options: [
        { value: 'oud', label: 'Oud' },
        { value: 'vanilla', label: 'Vanilla' },
        { value: 'rose', label: 'Rose' },
        { value: 'citrus', label: 'Citrus' },
        { value: 'musk', label: 'Musk' },
        { value: 'amber', label: 'Amber' },
        { value: 'jasmine', label: 'Jasmine' },
        { value: 'sandalwood', label: 'Sandalwood' },
        { value: 'leather', label: 'Leather' },
      ],
    },
    {
      id: 'avoidNotes',
      prompt: 'Any notes to avoid?',
      type: 'multi',
      options: [
        { value: 'oud', label: 'Oud' },
        { value: 'vanilla', label: 'Vanilla' },
        { value: 'rose', label: 'Rose' },
        { value: 'musk', label: 'Musk' },
        { value: 'patchouli', label: 'Patchouli' },
      ],
    },
    {
      id: 'occasion',
      prompt: 'Where will you wear it most?',
      type: 'single',
      options: [
        { value: 'everyday', label: 'Everyday' },
        { value: 'office', label: 'Office' },
        { value: 'evening', label: 'Evening' },
        { value: 'special', label: 'Special occasions' },
      ],
    },
    {
      id: 'climate',
      prompt: 'Your typical climate?',
      type: 'single',
      options: [
        { value: 'hot', label: 'Hot / humid' },
        { value: 'temperate', label: 'Temperate' },
        { value: 'cold', label: 'Cold' },
      ],
    },
    {
      id: 'budget',
      prompt: 'Comfortable budget per bottle?',
      type: 'single',
      options: [
        { value: 'u50', label: 'Under ₦50,000' },
        { value: '50_100', label: '₦50,000 – ₦100,000' },
        { value: '100_200', label: '₦100,000 – ₦200,000' },
        { value: '200_plus', label: '₦200,000+' },
      ],
    },
  ],
}

// --- Answer schema + derivation ---
export const answersSchema = z.object({
  families: z.array(z.string()).default([]),
  intensity: z.enum(['subtle', 'moderate', 'bold']).optional(),
  loveNotes: z.array(z.string()).default([]),
  avoidNotes: z.array(z.string()).default([]),
  occasion: z.enum(['everyday', 'office', 'evening', 'special']).optional(),
  climate: z.enum(['hot', 'temperate', 'cold']).optional(),
  budget: z.enum(['u50', '50_100', '100_200', '200_plus']).optional(),
})
export type QuizAnswers = z.infer<typeof answersSchema>

const BUDGET_MAX: Record<string, number> = {
  u50: 50_000,
  '50_100': 100_000,
  '100_200': 200_000,
  '200_plus': 2_000_000,
}

const ARCHETYPE: Record<string, string> = {
  WOODY: 'The Connoisseur',
  FLORAL: 'The Romantic',
  ORIENTAL: 'The Enigma',
  FRESH: 'The Minimalist',
  CITRUS: 'The Free Spirit',
  GOURMAND: 'The Indulgent',
  SPICY: 'The Maverick',
}

export interface DerivedProfile {
  archetype: string
  preferredFamilies: string[]
  preferredNotes: string[]
  dislikedNotes: string[]
  intensity: string | null
  budgetMaxNGN: number | null
  occasion: string | null
  climate: string | null
}

/** Pure, deterministic derivation from quiz answers. Infers only fragrance preferences. */
export function deriveProfile(answers: QuizAnswers): DerivedProfile {
  const preferredFamilies = answers.families ?? []
  const dominant = preferredFamilies[0]
  return {
    archetype: (dominant && ARCHETYPE[dominant]) || 'The Explorer',
    preferredFamilies,
    preferredNotes: answers.loveNotes ?? [],
    dislikedNotes: answers.avoidNotes ?? [],
    intensity: answers.intensity ?? null,
    budgetMaxNGN: answers.budget ? BUDGET_MAX[answers.budget] : null,
    occasion: answers.occasion ?? null,
    climate: answers.climate ?? null,
  }
}

// app/api/v1/quiz/route.ts
// GET  /api/v1/quiz  -> versioned question definitions
// POST /api/v1/quiz  -> submit answers; returns derived Fragrance DNA profile + grounded
//                        recommendations. Persists a quiz session; persists the profile for signed-in
//                        users who consent. Infers only fragrance preferences (no sensitive traits).
import { z } from 'zod'
import { route } from '@/lib/http/handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSearch, getCommerce, getAi } from '@/integrations/registry'
import { recommend } from '@/lib/recommendations/engine'
import { QUIZ_V1, QUIZ_VERSION, answersSchema, deriveProfile } from '@/lib/quiz/definition'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  return { data: QUIZ_V1 }
})

const bodySchema = z.object({
  answers: answersSchema,
  consent: z.boolean().optional().default(false),
})

export const POST = route(async ({ req }) => {
  const { answers, consent } = bodySchema.parse(await req.json())
  const profile = deriveProfile(answers)

  const session = await auth()
  const email = session?.user?.email ?? undefined
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
    : null

  // Persist a quiz session (anonymous allowed). Best-effort — never blocks the response.
  await prisma.scentQuizSession
    .create({
      data: {
        userId: user?.id ?? null,
        quizVersion: QUIZ_VERSION,
        answers: answers as object,
        derivedProfile: profile as object,
        consentGiven: consent,
      },
    })
    .catch(() => {})

  // Persist the profile only for a signed-in user who consented.
  if (user && consent) {
    await prisma.scentProfile
      .upsert({
        where: { userId: user.id },
        update: {
          archetype: profile.archetype,
          preferredFamilies: profile.preferredFamilies.join(','),
          preferredNotes: profile.preferredNotes.join(','),
          dislikedNotes: profile.dislikedNotes.join(','),
          intensity: profile.intensity,
          budgetMaxNGN: profile.budgetMaxNGN,
          occasion: profile.occasion,
          climate: profile.climate,
        },
        create: {
          userId: user.id,
          archetype: profile.archetype,
          preferredFamilies: profile.preferredFamilies.join(','),
          preferredNotes: profile.preferredNotes.join(','),
          dislikedNotes: profile.dislikedNotes.join(','),
          intensity: profile.intensity,
          budgetMaxNGN: profile.budgetMaxNGN,
          occasion: profile.occasion,
          climate: profile.climate,
        },
      })
      .catch(() => {})
  }

  // Grounded recommendations from the derived profile (explicit constraints; no AI intent needed).
  const rec = await recommend(
    {
      includeNotes: profile.preferredNotes,
      excludeNotes: profile.dislikedNotes,
      budgetMaxNGN: profile.budgetMaxNGN,
      family: profile.preferredFamilies[0] ?? null,
      occasion: profile.occasion,
      climate: profile.climate,
      limit: 6,
    },
    { search: getSearch(), catalog: getCommerce().catalog, ai: getAi() },
  )

  return {
    data: {
      quizVersion: QUIZ_VERSION,
      profile,
      recommendations: rec.items,
      disclaimer: rec.disclaimer,
    },
    meta: { count: rec.items.length },
  }
})

// app/api/v1/concierge/route.ts
// POST /api/v1/concierge — AI Scent Concierge. Conversational message in, grounded, typed
// recommendations out. Refuses/clarifies requests outside the catalogue. No medical/health advice.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { getSearch, getCommerce, getAi } from '@/integrations/registry'
import { recommend } from '@/lib/recommendations/engine'

export const runtime = 'nodejs'

const bodySchema = z.object({
  message: z.string().min(1).max(1000),
  budgetMaxNGN: z.number().int().positive().optional(),
  excludeNotes: z.array(z.string()).max(20).optional(),
  sampleFirst: z.boolean().optional(),
  limit: z.number().int().min(1).max(12).optional(),
})

export const POST = route(async ({ req }) => {
  if (!isFeatureEnabled('ai_concierge')) raise('FEATURE_DISABLED')
  const body = bodySchema.parse(await req.json())

  const result = await recommend(
    {
      query: body.message,
      budgetMaxNGN: body.budgetMaxNGN ?? null,
      excludeNotes: body.excludeNotes,
      preferSample: body.sampleFirst,
      limit: body.limit ?? 6,
    },
    { search: getSearch(), catalog: getCommerce().catalog, ai: getAi() },
  )

  const message = result.unsupportedReason
    ? result.unsupportedReason
    : result.items.length > 0
      ? 'Here are catalogue matches for your request.'
      : 'I could not find an in-stock match. Try widening your budget or notes.'

  return {
    data: {
      items: result.items,
      message,
      explanation: result.explanation,
      constraints: result.constraints,
      disclaimer: result.disclaimer,
    },
    meta: { count: result.items.length },
  }
})

// app/api/v1/gift/route.ts
// POST /api/v1/gift -> Gift Concierge. Structured recipient inputs -> grounded product suggestions.
// Delivery feasibility is computed SEPARATELY from AI generation (deterministic), never asserted by
// the model. No medical/health claims.
import { z } from 'zod'
import { route } from '@/lib/http/handler'
import { getSearch, getCommerce, getAi } from '@/integrations/registry'
import { recommend } from '@/lib/recommendations/engine'
import { checkDeliveryFeasibility } from '@/lib/gift/feasibility'

export const runtime = 'nodejs'

const bodySchema = z.object({
  relationship: z.string().min(1).max(60),
  ageRange: z.string().max(30).optional(),
  style: z.string().max(60).optional(),
  personality: z.array(z.string().max(40)).max(10).optional(),
  favouriteScents: z.array(z.string().max(60)).max(10).optional(),
  occasion: z.string().max(40).optional(),
  budgetMaxNGN: z.number().int().positive().optional(),
  desiredImpression: z.string().max(120).optional(),
  giftWrap: z.boolean().optional(),
  deliveryDeadline: z.string().optional(), // ISO date
  limit: z.number().int().min(1).max(12).optional(),
})

export const POST = route(async ({ req }) => {
  const body = bodySchema.parse(await req.json())

  // Compose a query the engine can ground; explicit budget still applies as a hard filter.
  const queryParts = [
    body.desiredImpression,
    body.style,
    body.occasion ? `for ${body.occasion}` : null,
    body.favouriteScents?.length ? `likes ${body.favouriteScents.join(', ')}` : null,
    body.personality?.length ? body.personality.join(', ') : null,
  ].filter(Boolean)
  const query = queryParts.join(' ') || `a gift for my ${body.relationship}`

  const rec = await recommend(
    {
      query,
      budgetMaxNGN: body.budgetMaxNGN ?? null,
      occasion: body.occasion ?? null,
      limit: body.limit ?? 6,
    },
    { search: getSearch(), catalog: getCommerce().catalog, ai: getAi() },
  )

  // Feasibility is computed independently of the AI output.
  const feasibility = checkDeliveryFeasibility({ deadlineISO: body.deliveryDeadline ?? null })

  return {
    data: {
      items: rec.items,
      giftWrapAvailable: true,
      giftWrapRequested: body.giftWrap ?? false,
      feasibility,
      explanation: rec.explanation,
      unsupportedReason: rec.unsupportedReason ?? null,
      disclaimer: rec.disclaimer,
    },
    meta: { count: rec.items.length },
  }
})

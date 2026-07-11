// app/api/v1/layering/route.ts
// POST /api/v1/layering -> editorial layering advice for two products + a best-effort AI tip.
// Compatibility is decided by deterministic editorial rules; the AI only phrases the result.
// Results are guidance, never guarantees. (Saving combinations is deferred until the migration is
// applied. See docs/BACKEND_UPGRADE_TODO.md.)
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getCommerce } from '@/integrations/registry'
import { evaluateLayering, type Family, type LayerInput } from '@/lib/layering/rules'
import { generateStructured } from '@/integrations/ai'

export const runtime = 'nodejs'

const FAMILIES: Family[] = ['FLORAL', 'WOODY', 'ORIENTAL', 'FRESH', 'CITRUS', 'GOURMAND', 'SPICY']
function toFamily(v: string | null): Family | null {
  if (!v) return null
  const up = v.toUpperCase()
  return (FAMILIES as string[]).includes(up) ? (up as Family) : null
}

const bodySchema = z.object({
  productIdA: z.string().min(1),
  productIdB: z.string().min(1),
})

const tipSchema = z.object({ tip: z.string().max(400) })

export const POST = route(async ({ req }) => {
  const { productIdA, productIdB } = bodySchema.parse(await req.json())
  if (productIdA === productIdB) raise('VALIDATION_ERROR', 'Pick two different fragrances to layer.')

  const catalog = getCommerce().catalog
  const [a, b] = await Promise.all([catalog.getProductById(productIdA), catalog.getProductById(productIdB)])
  if (!a || !b) raise('PRODUCT_NOT_FOUND')

  const inA: LayerInput = { name: a!.name, family: toFamily(a!.fragranceFamily) }
  const inB: LayerInput = { name: b!.name, family: toFamily(b!.fragranceFamily) }
  const advice = evaluateLayering(inA, inB)

  // Best-effort natural-language tip; never blocks the deterministic advice.
  let tip: string | null = null
  try {
    const res = await generateStructured(
      tipSchema,
      'Phrase this fragrance-layering guidance in one friendly sentence. Do not change the compatibility verdict or invent claims. It is guidance, not a guarantee.',
      JSON.stringify({ a: inA, b: inB, advice }),
      { task: 'layering_tip', promptVersion: 'v1' },
    )
    tip = res.tip
  } catch {
    tip = null
  }

  return {
    data: {
      products: [
        { id: a!.id, name: a!.name, family: inA.family },
        { id: b!.id, name: b!.name, family: inB.family },
      ],
      advice,
      tip,
    },
  }
})

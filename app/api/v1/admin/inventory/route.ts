// app/api/v1/admin/inventory/route.ts
// GET  -> inventory-health report (out-of-stock, reorder-needed, dead stock, duplicate SKUs)
// POST { productId, stock } -> set absolute stock (triggers back-in-stock on a 0 -> positive edge)
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { inventoryHealth, setStock } from '@/lib/catalogue/inventory'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const health = await inventoryHealth()
  return { data: { health } }
})

const bodySchema = z.object({ productId: z.string().min(1), stock: z.number().int().min(0) })

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const { productId, stock } = bodySchema.parse(await req.json())
  const result = await setStock(productId, stock, admin!.id)
  return { data: result }
})

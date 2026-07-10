// app/api/v1/admin/copilot/marketing/route.ts
// POST -> Owner Copilot marketing assistant. Returns an AI DRAFT only; never sends. Sending requires
// Approval Centre sign-off + the notification/newsletter pipeline. Owner-only.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { generateMarketingDraft } from '@/lib/copilot/marketing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  type: z.enum([
    'campaign_brief', 'email', 'whatsapp', 'launch_plan', 'gift_guide',
    'journal_outline', 'seo_brief', 'segment', 'offer_proposal', 'post_campaign_summary',
  ]),
  topic: z.string().min(1).max(400),
  audience: z.string().max(200).optional(),
  productNames: z.array(z.string().max(120)).max(20).optional(),
  constraints: z.string().max(400).optional(),
})

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const body = bodySchema.parse(await req.json())
  const draft = await generateMarketingDraft(body)
  return { data: { draft } }
})

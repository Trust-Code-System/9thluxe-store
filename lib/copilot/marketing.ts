// lib/copilot/marketing.ts
// Owner Copilot marketing assistant. Prepares DRAFTS only — campaign briefs, email/WhatsApp copy,
// launch plans, gift guides, journal outlines, SEO briefs, segments, offer proposals and
// post-campaign summaries. It NEVER sends anything: any real send must go through the Approval
// Centre (action: 'campaign') and the existing notification/newsletter pipeline.
import { aiServices } from '@/integrations/ai'

export type MarketingDraftType =
  | 'campaign_brief'
  | 'email'
  | 'whatsapp'
  | 'launch_plan'
  | 'gift_guide'
  | 'journal_outline'
  | 'seo_brief'
  | 'segment'
  | 'offer_proposal'
  | 'post_campaign_summary'

export interface MarketingDraftRequest {
  type: MarketingDraftType
  topic: string
  audience?: string
  productNames?: string[]
  constraints?: string
}

const TYPE_INSTRUCTIONS: Record<MarketingDraftType, string> = {
  campaign_brief: 'Write a concise campaign brief (objective, audience, key message, channels, CTA).',
  email: 'Write a marketing email draft (subject + body) for a perfume brand.',
  whatsapp: 'Write a short WhatsApp broadcast draft. Note: only sends to opted-in contacts.',
  launch_plan: 'Outline a product-launch plan with phases and timeline.',
  gift_guide: 'Draft a gift guide grouping the products by recipient/occasion.',
  journal_outline: 'Outline a journal/blog article about the topic.',
  seo_brief: 'Write an SEO brief: target keywords, title, meta description, headings.',
  segment: 'Propose a customer segment definition and why it matters.',
  offer_proposal: 'Propose a promotional offer with guardrails (margin, duration).',
  post_campaign_summary: 'Draft a post-campaign summary template with the metrics to fill in.',
}

export interface MarketingDraft {
  type: MarketingDraftType
  draft: string
  disclaimer: string
  autoSend: false
}

/**
 * Produce a marketing draft. Returns { autoSend: false } to make the non-sending contract explicit.
 * The AI layer redacts PII and validates output; on failure it surfaces a safe AppError upstream.
 */
export async function generateMarketingDraft(req: MarketingDraftRequest): Promise<MarketingDraft> {
  const brief = [
    TYPE_INSTRUCTIONS[req.type],
    `Topic: ${req.topic}`,
    req.audience ? `Audience: ${req.audience}` : '',
    req.productNames?.length ? `Products: ${req.productNames.join(', ')}` : '',
    req.constraints ? `Constraints: ${req.constraints}` : '',
    'Perfume-only brand. Do not fabricate discounts, stock, prices or claims. This is a draft for human review.',
  ]
    .filter(Boolean)
    .join('\n')

  const { draft } = await aiServices.draftMarketing({ brief })
  return {
    type: req.type,
    draft,
    disclaimer: 'AI-generated draft for human review. Not sent. Publishing/sending requires Approval Centre sign-off.',
    autoSend: false,
  }
}

"use client"

import { useMemo, useState } from "react"
import { NewsletterForm } from "./newsletter-form"
import { NewsletterHistory, type NewsletterCampaign } from "./newsletter-history"

type WorkflowProps = {
  subscriberCount: number
  campaigns: NewsletterCampaign[]
}

export function NewsletterWorkflow({ subscriberCount, campaigns }: WorkflowProps) {
  const [defaultValues, setDefaultValues] = useState<{ subject?: string; html?: string; text?: string }>()

  const hasDrafts = useMemo(() => campaigns.some((campaign) => campaign.status === "DRAFT"), [campaigns])

  return (
    <div className="space-y-6">
      <NewsletterForm subscriberCount={subscriberCount} defaultValues={defaultValues} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Campaign history</h3>
          {hasDrafts && (
            <button
              type="button"
              onClick={() => {
                const draft = campaigns.find((campaign) => campaign.status === "DRAFT")
                if (draft) setDefaultValues({ subject: draft.subject, html: draft.html, text: draft.text ?? "" })
              }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-primary"
            >
              Load latest draft
            </button>
          )}
        </div>
        <NewsletterHistory campaigns={campaigns} onDuplicate={(campaign) => setDefaultValues({ subject: campaign.subject, html: campaign.html, text: campaign.text ?? "" })} />
      </div>
    </div>
  )
}

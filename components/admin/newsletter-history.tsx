"use client"

import Link from "next/link"

export type NewsletterCampaign = {
  id: string
  subject: string
  status: "DRAFT" | "SCHEDULED" | "SENT"
  createdAt: string
  sentAt?: string | null
  summary?: string
  html: string
  text?: string | null
}

type NewsletterHistoryProps = {
  campaigns: NewsletterCampaign[]
  onDuplicate: (campaign: NewsletterCampaign) => void
}

const statusStyles: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENT: "bg-emerald-100 text-emerald-700",
}

export function NewsletterHistory({ campaigns, onDuplicate }: NewsletterHistoryProps) {
  if (!campaigns.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No campaigns yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <article key={campaign.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Campaign</p>
              <p className="text-lg font-semibold text-foreground">{campaign.subject}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[campaign.status]}`}>
              {campaign.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
            {campaign.sentAt ? ` • Sent ${new Date(campaign.sentAt).toLocaleDateString()}` : ""}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em]">
            <button
              type="button"
              onClick={() => onDuplicate(campaign)}
              className="rounded-full border border-muted-foreground px-4 py-2 text-muted-foreground transition hover:border-foreground hover:text-foreground"
            >
              Duplicate
            </button>
            <Link
              href={`/admin/newsletter?campaign=${campaign.id}`}
              className="rounded-full border border-muted-foreground px-4 py-2 text-muted-foreground transition hover:border-foreground hover:text-foreground"
            >
              View
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

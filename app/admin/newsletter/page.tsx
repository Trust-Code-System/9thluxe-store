import { Mail, TrendingUp, Users, AlertTriangle } from 'lucide-react'

import { NewsletterWorkflow } from '@/components/admin/newsletter-workflow'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminNewsletterPage() {
  await requireAdmin()

  const [subscribers, totalUsers, campaignsRaw] = await Promise.all([
    prisma.user.count({ where: { marketingEmails: true } }),
    prisma.user.count(),
    prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const campaigns = campaignsRaw.map((campaign) => ({
    ...campaign,
    createdAt: campaign.createdAt.toISOString(),
    sentAt: campaign.sentAt?.toISOString() ?? null,
  }))

  const stats = [
    {
      title: 'Newsletter subscribers',
      value: subscribers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      description: 'Marketing opted-in customers',
    },
    {
      title: 'Total users',
      value: totalUsers,
      icon: Users,
      color: 'bg-emerald-100 text-emerald-600',
      description: 'Registered accounts',
    },
    {
      title: 'Subscriber rate',
      value: totalUsers > 0 ? `${Math.round((subscribers / totalUsers) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      description: 'Share of users opted in',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Newsletter</h2>
      </div>

      <NewsletterWorkflow campaigns={campaigns} subscriberCount={subscribers} />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Email marketing</h3>
            <p className="text-sm text-muted-foreground">Manage subscribers and send campaigns they will open.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          <p>Subscribers can join through the homepage form and their account preferences.</p>
          <p>Every opt-in is saved with their marketing consent so you can stay compliant.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div>
              <h4 className="font-medium text-amber-900">Connect a provider</h4>
              <p className="mt-1 text-sm text-amber-800">
                Sending real campaigns requires an ESP (email service provider). Resend is a great starting point.
              </p>
              <div className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-800">
                <p className="font-semibold">Resend setup (about 5 minutes)</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Create an account at{' '}
                    <a className="underline" href="https://resend.com" rel="noreferrer" target="_blank">
                      resend.com
                    </a>
                  </li>
                  <li>Generate an API key from the dashboard.</li>
                  <li>
                    Add it to <code className="rounded bg-amber-100 px-1">.env</code> as{' '}
                    <code className="rounded bg-amber-100 px-1">RESEND_API_KEY=...</code>
                  </li>
                  <li>Install the SDK: `npm install resend` and call it from your newsletter API route.</li>
                </ol>
              </div>

              <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-800">
                <p className="font-semibold mb-2">Other options</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>SendGrid – reliable at scale, generous free tier.</li>
                  <li>Mailchimp – easy automations and segmentation.</li>
                  <li>ConvertKit – creator friendly drip campaigns.</li>
                </ul>
              </div>

              <p className="mt-4 text-xs text-amber-700">
                Need help? Check the `NEWSLETTER_INTEGRATION.md` playbook or drop us a note once you choose a provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

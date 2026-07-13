import { prisma } from "@/lib/prisma"
import { env, integrationStatus } from "@/lib/env"
import { allFlags } from "@/lib/config/feature-flags"
import { conciergeProviderStatus } from "@/integrations/ai/router"
import { CONCIERGE_PRICING_VERIFIED_AT } from "@/lib/concierge/cost"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function ConciergeAdminPage() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [conversations, usage, feedback, statuses, intents, cacheHits] = await Promise.all([
    prisma.conciergeConversation.count(),
    prisma.conciergeUsageEvent.aggregate({ where: { createdAt: { gte: since } }, _count: true, _avg: { totalLatencyMs: true, firstTokenLatencyMs: true }, _sum: { inputTokens: true, outputTokens: true, estimatedCostMicros: true } }),
    prisma.conciergeFeedback.groupBy({ by: ["rating"], _count: true }),
    prisma.conciergeUsageEvent.groupBy({ by: ["completionStatus"], where: { createdAt: { gte: since } }, _count: true }),
    prisma.conciergeUsageEvent.groupBy({ by: ["intent"], where: { createdAt: { gte: since } }, _count: true, orderBy: { _count: { intent: "desc" } }, take: 8 }),
    prisma.conciergeUsageEvent.count({ where: { createdAt: { gte: since }, cacheStatus: "HIT" } }),
  ])
  const flags = allFlags()
  const configured = integrationStatus()
  const providers = conciergeProviderStatus()
  const failures = statuses.filter((status) => status.completionStatus !== "SUCCESS").reduce((sum, status) => sum + status._count, 0)
  const errorRate = usage._count ? `${((failures / usage._count) * 100).toFixed(1)}%` : "0%"
  const cacheRate = usage._count ? `${((cacheHits / usage._count) * 100).toFixed(1)}%` : "0%"
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Concierge V2</h1>
        <p className="mt-1 text-sm text-muted-foreground">Provider health, usage, limits, and emergency controls. Secret values are never shown.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Feature enabled" value={flags.concierge_v2 ? "Yes" : "No"} />
        <Metric label="Conversations" value={String(conversations)} />
        <Metric label="Turns, last 24h" value={String(usage._count)} />
        <Metric label="Average latency" value={`${Math.round(usage._avg.totalLatencyMs ?? 0)} ms`} />
        <Metric label="Average first token" value={`${Math.round(usage._avg.firstTokenLatencyMs ?? 0)} ms`} />
        <Metric label="Error rate" value={errorRate} />
        <Metric label="Cache hit rate" value={cacheRate} />
      </div>
      <Card>
        <CardHeader><CardTitle>Provider capability registry</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Provider</th><th>Configured</th><th>Model</th><th>Priority</th><th>Capabilities</th><th>Circuit</th></tr></thead><tbody>{providers.map((provider) => <tr key={provider.id} className="border-b last:border-0"><td className="py-3 font-medium capitalize">{provider.id}</td><td>{provider.enabled ? "Yes" : "No"}</td><td>{provider.model}</td><td>{provider.priority}</td><td className="max-w-md">{provider.capabilities.join(", ")}</td><td>{provider.circuits.some((c) => c.openUntil && c.openUntil > Date.now()) ? "Open" : "Healthy"}</td></tr>)}</tbody></table>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Limits and cost controls</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Setting label="Guest questions" value={env.CONCIERGE_GUEST_QUESTIONS} /><Setting label="Authenticated per minute" value={env.CONCIERGE_AUTH_PER_MINUTE} /><Setting label="Authenticated daily" value={env.CONCIERGE_AUTH_DAILY} /><Setting label="Web searches daily" value={env.CONCIERGE_WEB_DAILY} /><Setting label="Max tool calls" value={env.CONCIERGE_MAX_TOOL_CALLS} /><Setting label="Max search calls" value={env.CONCIERGE_MAX_SEARCH_CALLS} /><Setting label="Max output tokens" value={env.CONCIERGE_MAX_OUTPUT_TOKENS} /><Setting label="Daily spend limit" value={`$${env.CONCIERGE_DAILY_SPEND_USD}`} /><Setting label="Monthly spend limit" value={`$${env.CONCIERGE_MONTHLY_SPEND_USD}`} /><Setting label="Catalogue-only fallback" value={env.CONCIERGE_CATALOGUE_ONLY ? "On" : "Off"} />
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Usage, last 24 hours</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm sm:grid-cols-2"><Setting label="Input tokens" value={usage._sum.inputTokens ?? 0} /><Setting label="Output tokens" value={usage._sum.outputTokens ?? 0} /><Setting label="Estimated spend" value={`$${((usage._sum.estimatedCostMicros ?? 0) / 1_000_000).toFixed(2)}`} /><Setting label="Pricing verified" value={CONCIERGE_PRICING_VERIFIED_AT} /><Setting label="Configured AI selector" value={configured.ai} /><Setting label="Feedback" value={feedback.map((x) => `${x.rating}: ${x._count}`).join(", ") || "None"} /><Setting label="Top intents" value={intents.map((x) => `${x.intent}: ${x._count}`).join(", ") || "None"} /></CardContent></Card>
      </div>
      <p className="text-xs text-muted-foreground">Change provider priority, limits, spend gates, catalogue-only mode, or the emergency kill switch through environment configuration and feature flags, then redeploy. API secret values remain server-only.</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><CardContent className="pt-6"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></CardContent></Card> }
function Setting({ label, value }: { label: string; value: string | number }) { return <div className="flex justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div> }

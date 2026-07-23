import { prisma } from "@/lib/prisma"
import { allFlags, flagDefault, flagKeys, flagSource } from "@/lib/config/feature-flags"
import {
  FLAG_META,
  GROUP_LABELS,
  GROUP_ORDER,
  flagMeta,
  type FlagGroup,
} from "@/lib/config/feature-flag-meta"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

const SOURCE_LABEL: Record<ReturnType<typeof flagSource>, string> = {
  "enabled-by-env": "Enabled by FEATURE_FLAGS",
  "disabled-by-env": "Disabled by FEATURE_FLAGS",
  default: "Built-in default",
}

export default async function AdminFeatureFlagsPage() {
  const effective = allFlags()

  // Informational only: the resolver reads the FEATURE_FLAGS env var, not this table, so any rows
  // here are surfaced honestly as "not consulted" rather than shown as live toggles.
  let persisted: { key: string; enabled: boolean; description: string | null }[] = []
  try {
    persisted = await prisma.featureFlag.findMany({
      select: { key: true, enabled: true, description: true },
      orderBy: { key: "asc" },
    })
  } catch {
    persisted = []
  }

  const keys = flagKeys()
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    flags: keys.filter((k) => flagMeta(k).group === group),
  })).filter((g) => g.flags.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Feature flags</h1>
        <p className="max-w-3xl text-muted-foreground">
          Read-only view of every storefront feature flag and its effective state. Flags are
          controlled by the <code className="rounded bg-muted px-1 py-0.5 text-xs">FEATURE_FLAGS</code>{" "}
          environment variable so behaviour stays reproducible across deploys. Financial and
          approval-gated flags are owner-controlled and are never toggled from the admin panel.
        </p>
      </div>

      {grouped.map(({ group, flags }) => (
        <FlagGroupCard
          key={group}
          group={group}
          flags={flags.map((key) => ({
            key,
            meta: FLAG_META[key],
            enabled: effective[key],
            isDefault: flagDefault(key),
            source: flagSource(key),
          }))}
        />
      ))}

      {persisted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Persisted rows in the database</CardTitle>
            <CardDescription>
              These <code className="rounded bg-muted px-1 py-0.5 text-xs">FeatureFlag</code> rows
              exist in the database but are <strong>not</strong> consulted by the flag resolver.
              They are shown for transparency only. Change behaviour via the FEATURE_FLAGS env var.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {persisted.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
              >
                <span className="font-mono text-xs">{row.key}</span>
                <Badge variant="outline">{row.enabled ? "row: on" : "row: off"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface FlagView {
  key: string
  meta: (typeof FLAG_META)[keyof typeof FLAG_META]
  enabled: boolean
  isDefault: boolean
  source: ReturnType<typeof flagSource>
}

function FlagGroupCard({ group, flags }: { group: FlagGroup; flags: FlagView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{GROUP_LABELS[group]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{flag.meta.label}</span>
                <code className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground">
                  {flag.key}
                </code>
                {flag.meta.ownerControlled && (
                  <Badge variant="outline" className="border-warning/40 text-warning">
                    Owner-controlled
                  </Badge>
                )}
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">{flag.meta.description}</p>
              <p className="text-xs text-muted-foreground">
                Default {flag.isDefault ? "on" : "off"} &middot; {SOURCE_LABEL[flag.source]}
              </p>
            </div>
            <div className="shrink-0">
              {flag.enabled ? (
                <Badge className="bg-success/15 text-success hover:bg-success/15">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

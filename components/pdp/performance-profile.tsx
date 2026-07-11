import { Info } from "lucide-react"
import { ProvenanceChip } from "./provenance-chip"
import type { PdpPerformanceMetric } from "@/lib/pdp/types"

/**
 * Performance profile driven ONLY by aggregated verified-customer ratings. Each bar shows the number
 * of reviews contributing (never a fabricated score). If no structured ratings exist yet, the whole
 * section is hidden by the caller. This is customer-aggregated opinion, clearly labelled, not a lab
 * measurement, and deliberately not a copy of any third-party voting UI.
 */
export function PerformanceProfile({ metrics }: { metrics: PdpPerformanceMetric[] }) {
  const withScores = metrics.filter((m) => m.score != null)
  if (withScores.length === 0) return null

  return (
    <div className="max-w-xl space-y-5">
      <ul className="space-y-5">
        {withScores.map((m) => {
          const pct = Math.round(((m.score as number) / 5) * 100)
          return (
            <li key={m.key}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{m.label}</span>
                <span className="text-xs text-muted-foreground">
                  {m.score?.toFixed(1)} / 5 · {m.count} verified review{m.count === 1 ? "" : "s"}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${m.label}: ${m.score} out of 5 from ${m.count} verified reviews`}>
                <div className="h-full rounded-full bg-moss" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3" aria-hidden /> {m.definition}
              </p>
            </li>
          )
        })}
      </ul>
      <ProvenanceChip source="CUSTOMER_AGGREGATE" />
    </div>
  )
}

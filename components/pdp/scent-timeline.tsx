"use client"

import { useInView } from "./reveal"
import { ProvenanceChip } from "./provenance-chip"
import type { TimelineStage } from "@/lib/fragrance/types"

/**
 * Five-stage scent-development timeline (opening through late dry-down). Each stage shows its time
 * window, the notes that dominate it, a general impression, and a relative-intensity bar. The
 * intensity is editorial, not measured, and the footnote is explicit that real performance varies by
 * skin, clothing, climate and application. Renders nothing when there are no stages.
 */
export function ScentTimeline({ stages }: { stages: TimelineStage[] }) {
  const { ref, inView } = useInView<HTMLOListElement>()
  if (stages.length === 0) return null

  return (
    <div className="max-w-3xl">
      <ol ref={ref} className="relative space-y-5 border-l border-border pl-6">
        {stages.map((stage) => (
          <li key={stage.key} className="relative">
            <span
              aria-hidden
              className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-background"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-serif text-base text-foreground">{stage.label}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{stage.window}</p>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {stage.notes.map((n) => (
                <span key={n} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{stage.impression}</p>
            <div
              className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-secondary"
              role="img"
              aria-label={`Relative intensity: ${Math.round(stage.intensity * 100)} percent`}
            >
              <div
                className="h-full rounded-full bg-accent/70 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{ width: inView ? `${Math.round(stage.intensity * 100)}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">
        A guide, not a guarantee. How a fragrance actually develops varies with your skin, clothing,
        the climate and how much you apply.
      </p>
      <ProvenanceChip source="EDITORIAL" className="mt-3" />
    </div>
  )
}

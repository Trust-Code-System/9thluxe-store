"use client"

import { useInView } from "./reveal"
import { cn } from "@/lib/utils"
import type { PdpTimelineStage } from "@/lib/pdp/types"

/**
 * "How it wears": an editorial progression across four stages, built only from the product's real
 * notes. It is explicitly guidance, not a guarantee, and says so. The intensity mini-curve animates
 * on view (width-only, no layout shift) and is instant under reduced motion.
 */
export function WearTimeline({ stages }: { stages: PdpTimelineStage[] }) {
  const { ref, inView } = useInView<HTMLOListElement>()
  if (stages.length === 0) return null

  return (
    <div className="max-w-3xl">
      <ol ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, i) => (
          <li
            key={stage.key}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card/70 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">{stage.label}</span>
              <span className="text-[10px] text-muted-foreground">{stage.window}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
              <div
                className={cn(
                  "h-full rounded-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none",
                )}
                style={{ width: inView ? `${Math.round(stage.intensity * 100)}%` : "0%", transitionDelay: `${i * 80}ms` }}
              />
            </div>
            <p className="text-sm font-medium capitalize text-foreground">{stage.notes.slice(0, 3).join(" · ")}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{stage.impression}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs italic text-muted-foreground">
        Editorial guidance only. How a fragrance actually wears depends on your skin chemistry, how much you apply,
        clothing, and the weather. Results vary from person to person.
      </p>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useInView } from "./reveal"
import { ProvenanceChip } from "./provenance-chip"
import { PROMINENCE_LABEL, PROMINENCE_DISCLAIMER } from "@/lib/fragrance/enrich"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { AccordProminence } from "@/lib/fragrance/types"

/** Small, reusable perceived-prominence badge. Text carries the meaning; colour is never the only cue. */
export function ProminenceBadge({ label }: { label: AccordProminence["label"] }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {PROMINENCE_LABEL[label]}
    </span>
  )
}

/**
 * Main accords as accessible prominence bars. The bar width and the 0-100 number encode PERCEIVED
 * scent character, explicitly NOT a chemical formulation percentage. The info popover states this and
 * is keyboard reachable. The rank + label carry the meaning for screen readers; colour is decorative.
 */
export function AccordProminenceBars({
  accords,
  productId,
  showScore = true,
}: {
  accords: AccordProminence[]
  productId: string
  showScore?: boolean
}) {
  const { ref, inView } = useInView<HTMLUListElement>()
  if (accords.length === 0) return null

  return (
    <div className="max-w-xl">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {showScore ? "Perceived scent prominence" : "Character strength"}
        </span>
        <Popover>
          <PopoverTrigger
            aria-label="What does perceived scent prominence mean?"
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </PopoverTrigger>
          <PopoverContent className="max-w-xs text-xs leading-relaxed">
            {PROMINENCE_DISCLAIMER}
          </PopoverContent>
        </Popover>
      </div>
      <ul ref={ref} className="space-y-3">
        {accords.map((accord) => (
          <li key={accord.slug}>
            <Link
              href={`/shop?accord=${encodeURIComponent(accord.slug)}`}
              onClick={() => trackPdp("accord_selected", { productId, accord: accord.slug })}
              className="group block focus-visible:outline-none"
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium capitalize group-hover:text-accent group-focus-visible:text-accent">
                  {accord.name}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">{PROMINENCE_LABEL[accord.label]}</span>
                  {showScore && <span className="tabular-nums">{accord.score}</span>}
                </span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${accord.name}: ${PROMINENCE_LABEL[accord.label]} (rank ${accord.rank})`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    width: inView ? `${accord.score}%` : "0%",
                    backgroundColor: accord.color,
                  }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <ProvenanceChip source="EDITORIAL" className="mt-4" />
    </div>
  )
}

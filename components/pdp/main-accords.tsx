"use client"

import Link from "next/link"
import { useInView } from "./reveal"
import { ProvenanceChip } from "./provenance-chip"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { PdpAccord } from "@/lib/pdp/types"

/**
 * Ranked main accords as proportional bars. The width encodes RANK ORDER (strongest = full width),
 * NOT a fabricated laboratory percentage: there is no numeric claim on screen. Rank number carries
 * the meaning for screen readers and colour is never the only signal. Each accord links to an
 * exploration of the catalogue.
 */
export function MainAccords({ accords, productId }: { accords: PdpAccord[]; productId: string }) {
  const { ref, inView } = useInView<HTMLUListElement>()
  if (accords.length === 0) return null

  return (
    <div className="max-w-xl">
      <ul ref={ref} className="space-y-3">
        {accords.map((accord) => (
          <li key={accord.slug}>
            <Link
              href={`/shop?accord=${encodeURIComponent(accord.slug)}`}
              onClick={() => trackPdp("accord_selected", { productId, accord: accord.slug })}
              className="group block focus-visible:outline-none"
            >
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium capitalize group-hover:text-accent group-focus-visible:text-accent">
                  {accord.name}
                </span>
                <span className="text-xs text-muted-foreground">#{accord.rank} strongest</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: inView ? `${Math.round(accord.strength * 100)}%` : "0%" }}
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

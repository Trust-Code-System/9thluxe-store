"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { GitCompareArrows, X, ArrowRight } from "lucide-react"
import { useCompareStore, MAX_COMPARE } from "@/lib/stores/compare-store"
import { trackPdp } from "@/lib/analytics/pdp-events"

/**
 * Floating comparison tray. Appears whenever the persisted compare set is non-empty, so items added
 * from any product card on the page surface here. Positioned above the mobile sticky purchase bar.
 */
export function CompareDrawer() {
  const items = useCompareStore((s) => s.items)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const prevCount = React.useRef(0)

  React.useEffect(() => setMounted(true), [])

  // Expand the tray the moment a fragrance is added, so users see what compare is and what to do
  // next instead of hunting for a small pill in the corner.
  React.useEffect(() => {
    if (items.length > prevCount.current) setOpen(true)
    prevCount.current = items.length
  }, [items.length])

  if (!mounted || items.length === 0) return null

  const canCompare = items.length >= 2

  return (
    <div className="fixed bottom-24 right-4 z-[var(--z-sticky)] lg:bottom-6">
      {open ? (
        <div className="w-[300px] rounded-2xl border border-border bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              Compare ({items.length}/{MAX_COMPARE})
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clear} className="text-xs text-muted-foreground underline">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Collapse compare tray">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary/40">
                  {c.image && <Image src={c.image} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs">{c.name}</span>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`Remove ${c.name} from comparison`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {canCompare ? (
            <Link
              href="/compare"
              onClick={() => trackPdp("comparison_completed", { count: items.length })}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Compare now <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Add one more fragrance to compare them side by side.
              </p>
              <Link
                href="/shop"
                className="flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/60"
              >
                Browse fragrances <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-xl"
        >
          <GitCompareArrows className="h-4 w-4" /> Compare · {items.length}
        </button>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { GitCompareArrows, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
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

  React.useEffect(() => setMounted(true), [])
  if (!mounted || items.length === 0) return null

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
          <Link
            href="/compare"
            onClick={() => trackPdp("comparison_completed", { count: items.length })}
            className={cn(
              "mt-3 flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground",
              items.length < 2 && "pointer-events-none opacity-50",
            )}
            aria-disabled={items.length < 2}
          >
            Compare {items.length < 2 ? "(add one more)" : "now"} <ArrowRight className="h-4 w-4" />
          </Link>
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

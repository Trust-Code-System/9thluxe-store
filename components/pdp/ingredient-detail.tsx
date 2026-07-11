"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { IngredientArt } from "./ingredient-art"
import { ProminenceBadge } from "./accord-prominence"
import { PROMINENCE_LABEL } from "@/lib/fragrance/enrich"
import { getIngredient } from "@/lib/fragrance/ingredients"
import { toSlug } from "@/lib/pdp/parse"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { CompositionNote } from "@/lib/fragrance/types"

const TIER_LABEL: Record<CompositionNote["tier"], string> = {
  top: "Top note",
  heart: "Heart note",
  base: "Base note",
}

/**
 * Accessible ingredient detail. Opens as a focus-trapped dialog (works with mouse, touch, keyboard and
 * screen readers). Shows the ingredient's scent character, its role in THIS perfume, related notes,
 * an exploration link to other fragrances containing it, and grounded layering suggestions. All copy
 * is from the approved library; nothing about this specific perfume is invented.
 */
export function IngredientDetailDialog({
  note,
  productName,
  productId,
  onClose,
}: {
  note: CompositionNote | null
  productName: string
  productId: string
  onClose: () => void
}) {
  const open = note != null
  const ing = note?.match.ingredient ?? null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {note && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <IngredientArt note={note} size={72} className="shrink-0" />
                <div>
                  <DialogTitle className="font-serif text-2xl leading-tight">
                    {ing?.displayName ?? note.match.input.trim()}
                  </DialogTitle>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                      {TIER_LABEL[note.tier]}
                    </span>
                    <ProminenceBadge label={note.prominence} />
                  </div>
                </div>
              </div>
            </DialogHeader>

            {ing ? (
              <div className="space-y-5">
                {ing.descriptors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ing.descriptors.map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize text-secondary-foreground"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                <DialogDescription className="text-sm leading-relaxed text-foreground/85">
                  {ing.longDescription}
                </DialogDescription>

                <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                  <p className="font-medium">Its role in {productName}</p>
                  <p className="mt-1 text-muted-foreground">
                    Sits in the {TIER_LABEL[note.tier].toLowerCase()} with{" "}
                    {PROMINENCE_LABEL[note.prominence].toLowerCase()} perceived prominence.
                  </p>
                </div>

                {ing.related.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Related notes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ing.related.map((r) => {
                        const rel = getIngredient(r)
                        return (
                          <Link
                            key={r}
                            href={`/shop?note=${encodeURIComponent(toSlug(r))}`}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {rel?.displayName ?? r}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {ing.related.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-4">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Layering idea: </span>
                      pairs naturally with{" "}
                      {ing.related
                        .slice(0, 2)
                        .map((r) => getIngredient(r)?.displayName ?? r)
                        .join(" and ")}
                      .
                    </p>
                  </div>
                )}

                <Link
                  href={`/shop?note=${encodeURIComponent(ing.canonicalName.replace(/\s+/g, "-"))}`}
                  onClick={() => trackPdp("note_selected", { productId, note: ing.canonicalName })}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  Explore other fragrances with {ing.displayName}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            ) : (
              <DialogDescription className="text-sm text-muted-foreground">
                This note is not yet in our ingredient library, so we cannot show its full profile. Our
                team reviews new notes before they are added.
              </DialogDescription>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

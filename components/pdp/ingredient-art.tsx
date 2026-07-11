"use client"

import * as React from "react"
import { ingredientArtDataUri } from "@/lib/fragrance/art"
import { cn } from "@/lib/utils"
import type { CompositionNote } from "@/lib/fragrance/types"

/**
 * Renders the house-generated art for one composition note. Matched notes get their deterministic
 * ingredient art; an unmatched (unknown) note gets a neutral tinted disc so the layout never breaks.
 * The image is decorative here (the surrounding control carries the accessible name), so alt="".
 */
export function IngredientArt({
  note,
  size = 96,
  cutout = false,
  className,
}: {
  note: CompositionNote
  size?: number
  cutout?: boolean
  className?: string
}) {
  const ing = note.match.ingredient
  const label = ing?.displayName ?? note.match.input.trim()

  const src = React.useMemo(() => (ing ? ingredientArtDataUri(ing, { size, cutout }) : null), [ing, size, cutout])

  if (!src) {
    // Unknown note: no library art. Show a neutral monogram disc (still no fabricated imagery).
    return (
      <span
        className={cn(
          "grid place-items-center rounded-full border border-dashed border-border bg-secondary/50 text-sm font-medium uppercase text-muted-foreground",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {label.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn("select-none", className)}
      draggable={false}
    />
  )
}

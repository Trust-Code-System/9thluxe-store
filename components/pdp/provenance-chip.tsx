import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROVENANCE_LABEL } from "@/lib/pdp/parse"
import type { Provenance } from "@/lib/pdp/types"

const STYLES: Record<Provenance, string> = {
  BRAND: "bg-secondary text-secondary-foreground",
  EDITORIAL: "bg-accent/10 text-accent",
  CUSTOMER_AGGREGATE: "bg-moss/15 text-moss",
}

/**
 * A truthful source label so subjective fragrance data is never presented as a laboratory fact.
 * Text (not colour) always carries the meaning; colour is decorative only.
 */
export function ProvenanceChip({
  source,
  sampleSize,
  className,
}: {
  source: Provenance
  sampleSize?: number
  className?: string
}) {
  const label = PROVENANCE_LABEL[source]
  const suffix =
    source === "CUSTOMER_AGGREGATE" && typeof sampleSize === "number" ? ` · ${sampleSize} review${sampleSize === 1 ? "" : "s"}` : ""
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        STYLES[source],
        className,
      )}
    >
      <Info className="h-2.5 w-2.5" aria-hidden />
      {label}
      {suffix}
    </span>
  )
}

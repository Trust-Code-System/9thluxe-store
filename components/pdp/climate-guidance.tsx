"use client"

import * as React from "react"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

type Verdict = "excellent" | "good" | "controlled" | "evening" | "sample"

const VERDICT_COPY: Record<Verdict, { label: string; tone: string }> = {
  excellent: { label: "Excellent fit", tone: "bg-moss/15 text-moss border-moss/30" },
  good: { label: "Good fit", tone: "bg-accent/10 text-accent border-accent/30" },
  controlled: { label: "Best with controlled application", tone: "bg-secondary text-secondary-foreground border-border" },
  evening: { label: "Better for evenings", tone: "bg-secondary text-secondary-foreground border-border" },
  sample: { label: "Consider sampling first", tone: "bg-secondary text-secondary-foreground border-border" },
}

interface Condition {
  key: string
  label: string
  hint: string
}

const CONDITIONS: Condition[] = [
  { key: "lagos", label: "Lagos: heat & humidity", hint: "Hot, humid, coastal" },
  { key: "abuja", label: "Abuja: dry heat", hint: "Warm, dry" },
  { key: "rainy", label: "Rainy season", hint: "Cooler, damp" },
  { key: "harmattan", label: "Harmattan", hint: "Dry, dusty, cool mornings" },
  { key: "office", label: "Air-conditioned office", hint: "Cool, enclosed" },
  { key: "wedding", label: "Outdoor wedding", hint: "Warm, long day" },
  { key: "evening", label: "Evening event", hint: "Cooler, expressive" },
]

/**
 * Locally relevant, DESCRIPTIVE climate guidance. It derives a cautious verdict from the product's
 * real family/concentration/performance strings, never a medical, chemical, or guaranteed-performance
 * claim. The customer chooses a condition manually; geolocation is never requested.
 */
export function ClimateGuidance({
  family,
  concentration,
  sillage,
  longevity,
}: {
  family: string | null
  concentration: string | null
  sillage: string | null
  longevity: string | null
}) {
  const [condition, setCondition] = React.useState("lagos")

  const isHeavy =
    /parfum|extrait|edp/i.test(concentration ?? "") ||
    /oriental|gourmand|amber|oud|woody/i.test(family ?? "") ||
    /strong|heavy|beast/i.test(sillage ?? "") ||
    /long|all.?day|8|10|12/i.test(longevity ?? "")
  const isFresh = /fresh|citrus|aquatic|green/i.test(family ?? "")

  const verdictFor = (key: string): Verdict => {
    switch (key) {
      case "lagos":
      case "wedding":
        if (isFresh) return "excellent"
        if (isHeavy) return "controlled"
        return "good"
      case "abuja":
        return isFresh ? "good" : "good"
      case "rainy":
      case "harmattan":
        return isHeavy ? "excellent" : "good"
      case "office":
        return isHeavy ? "controlled" : "good"
      case "evening":
        return isHeavy ? "excellent" : "good"
      default:
        return "sample"
    }
  }

  const active = CONDITIONS.find((c) => c.key === condition) ?? CONDITIONS[0]
  const verdict = verdictFor(condition)
  const copy = VERDICT_COPY[verdict]

  return (
    <div className="max-w-2xl">
      <label htmlFor="climate-select" className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-accent" aria-hidden /> Choose a condition
      </label>
      <div className="flex flex-wrap gap-2">
        {CONDITIONS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCondition(c.key)}
            aria-pressed={c.key === condition}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              c.key === condition ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-muted-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{active.label}</p>
            <p className="text-xs text-muted-foreground">{active.hint}</p>
          </div>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", copy.tone)}>{copy.label}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{guidanceText(verdict, active.label)}</p>
      </div>
      <p className="mt-3 text-xs italic text-muted-foreground">
        Descriptive guidance based on this fragrance&apos;s style, not a performance guarantee. Skin, application and the
        day itself all change how a scent behaves.
      </p>
    </div>
  )
}

function guidanceText(verdict: Verdict, condition: string): string {
  switch (verdict) {
    case "excellent":
      return `This composition tends to shine in ${condition.toLowerCase()}. Expect it to project pleasantly without needing much.`
    case "good":
      return `A comfortable match for ${condition.toLowerCase()}. A couple of sprays should carry you through.`
    case "controlled":
      return `Rich for ${condition.toLowerCase()}. Apply lightly (one or two sprays) so it reads elegant rather than heavy.`
    case "evening":
      return `Leans expressive; it often suits ${condition.toLowerCase()} best when the air is cooler.`
    default:
      return `Everyone wears this differently. A sample is the surest way to know how it behaves for you in ${condition.toLowerCase()}.`
  }
}

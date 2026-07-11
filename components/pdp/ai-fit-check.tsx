"use client"

import * as React from "react"
import { Loader2, Sparkles, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SmartProductCard } from "./smart-product-card"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { PdpCard } from "@/lib/pdp/types"

interface ProductFacts {
  id: string
  name: string
  notes: string[]
  family: string | null
  priceNGN: number
  occasion: string | null
  climate: string | null
  hasSample: boolean
}

interface FitResult {
  score: number
  matching: string[]
  conflicts: string[]
  sampleFirst: boolean
}

const OCCASIONS = ["Everyday", "Office", "Evening", "Wedding", "Date"]
const CLIMATES = ["Lagos humid", "Abuja dry", "Rainy", "Harmattan", "AC office"]

/**
 * "Will this suit me?": optional, AI-ASSISTED fit guidance. It reasons ONLY over this product's real
 * attributes and, for alternatives, over the catalogue-grounded recommender (which never invents a
 * product, price, or note). The match is computed transparently from your inputs; we show exactly
 * which attributes matched or conflicted. Output is labelled guidance, not a guarantee, and internal
 * prompts/reasoning traces are never exposed.
 */
export function AiFitCheck({ product }: { product: ProductFacts }) {
  const [liked, setLiked] = React.useState("")
  const [disliked, setDisliked] = React.useState("")
  const [occasion, setOccasion] = React.useState("")
  const [climate, setClimate] = React.useState("")
  const [budget, setBudget] = React.useState("")
  const [result, setResult] = React.useState<FitResult | null>(null)
  const [alts, setAlts] = React.useState<PdpCard[] | null>(null)
  const [loading, setLoading] = React.useState(false)

  const parseNotes = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)

  const run = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    trackPdp("ai_match_started", { productId: product.id })

    const likedNotes = parseNotes(liked)
    const dislikedNotes = parseNotes(disliked)
    const productNotes = product.notes.map((n) => n.toLowerCase())
    const budgetN = budget ? Number(budget) : null

    // Transparent match over REAL product data.
    let score = 55
    const matching: string[] = []
    const conflicts: string[] = []
    for (const n of likedNotes) {
      if (productNotes.some((pn) => pn.includes(n) || n.includes(pn))) {
        score += 10
        matching.push(`Contains ${n}`)
      }
    }
    for (const n of dislikedNotes) {
      if (productNotes.some((pn) => pn.includes(n) || n.includes(pn))) {
        score -= 18
        conflicts.push(`Contains ${n}, which you'd rather avoid`)
      }
    }
    if (occasion && product.occasion && product.occasion.toLowerCase().includes(occasion.toLowerCase())) {
      score += 8
      matching.push(`Suited to ${occasion.toLowerCase()}`)
    }
    if (climate && product.climate && product.climate.toLowerCase().includes(climate.toLowerCase().split(" ")[0])) {
      score += 6
      matching.push(`Noted for ${climate.toLowerCase()} conditions`)
    }
    if (budgetN != null) {
      if (product.priceNGN <= budgetN) {
        score += 6
        matching.push("Within your budget")
      } else {
        score -= 10
        conflicts.push("Above your budget")
      }
    }
    score = Math.max(5, Math.min(98, score))
    const fit: FitResult = { score, matching, conflicts, sampleFirst: score < 70 && product.hasSample }
    setResult(fit)

    // Grounded alternatives from the real catalogue.
    try {
      const params = new URLSearchParams()
      if (likedNotes.length) params.set("notes", likedNotes.join(","))
      if (dislikedNotes.length) params.set("excludeNotes", dislikedNotes.join(","))
      if (product.family) params.set("family", product.family)
      if (occasion) params.set("occasion", occasion)
      if (budgetN != null) params.set("budgetMaxNGN", String(budgetN))
      params.set("limit", "4")
      const res = await fetch(`/api/v1/recommendations?${params.toString()}`)
      const json = await res.json()
      const items = (json.data?.items ?? []) as {
        product: {
          id: string
          slug: string
          name: string
          brand: string | null
          concentration: string | null
          price: { amountNGN: number }
          compareAtPrice: { amountNGN: number } | null
          images: string[]
          ratingAvg: number
          ratingCount: number
          fragranceFamily: string | null
          notesTop: string | null
          notesHeart: string | null
        }
        reasons: string[]
        availability: "in_stock" | "preorder" | "waitlist"
      }[]
      setAlts(
        items
          .filter((i) => i.product.id !== product.id)
          .map((i) => ({
            id: i.product.id,
            slug: i.product.slug,
            name: i.product.name,
            brand: i.product.brand,
            concentration: i.product.concentration,
            priceNGN: i.product.price.amountNGN,
            compareAtNGN: i.product.compareAtPrice?.amountNGN ?? null,
            image: i.product.images?.[0] ?? null,
            ratingAvg: i.product.ratingAvg,
            ratingCount: i.product.ratingCount,
            fragranceFamily: i.product.fragranceFamily,
            notes: [i.product.notesTop, i.product.notesHeart].filter(Boolean).join(",").split(",").map((n) => n.trim()).filter(Boolean).slice(0, 4),
            hasSample: false,
            availability: i.availability === "in_stock" ? "in_stock" : i.availability,
            reason: i.reasons?.[0],
          })),
      )
    } catch {
      setAlts([])
    } finally {
      setLoading(false)
      trackPdp("ai_match_completed", { productId: product.id, score })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <span className="eyebrow mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> AI-assisted guidance
      </span>
      <h3 className="font-serif text-xl">Will this suit me?</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us what you love and we&apos;ll check it against this fragrance&apos;s real profile, and suggest grounded
        alternatives from our catalogue. Guidance only, never a guarantee.
      </p>

      <form onSubmit={run} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Notes you love" hint="comma-separated">
          <input className={inputCls} value={liked} onChange={(e) => setLiked(e.target.value)} placeholder="oud, amber" />
        </Field>
        <Field label="Notes to avoid" hint="comma-separated">
          <input className={inputCls} value={disliked} onChange={(e) => setDisliked(e.target.value)} placeholder="anise" />
        </Field>
        <Field label="Occasion">
          <Select value={occasion || "any"} onValueChange={(v) => setOccasion(v === "any" ? "" : v)}>
            <SelectTrigger className="h-10 rounded-lg" aria-label="Occasion">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {OCCASIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Climate">
          <Select value={climate || "any"} onValueChange={(v) => setClimate(v === "any" ? "" : v)}>
            <SelectTrigger className="h-10 rounded-lg" aria-label="Climate">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {CLIMATES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Budget (₦)">
          <input
            className={inputCls}
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="150000"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check my fit"}
          </Button>
        </div>
      </form>

      {result && (
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-semibold",
                result.score >= 70 ? "bg-moss/15 text-moss" : result.score >= 45 ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground",
              )}
              role="img"
              aria-label={`Fit score ${result.score} out of 100`}
            >
              {result.score}
            </div>
            <div>
              <p className="text-sm font-medium">
                {result.score >= 70 ? "Strong match" : result.score >= 45 ? "Worth exploring" : "May not be your best fit"}
              </p>
              <p className="text-xs text-muted-foreground">AI-assisted, based only on this fragrance&apos;s real data.</p>
            </div>
          </div>

          {result.matching.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {result.matching.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm text-foreground/90">
                  <Check className="h-4 w-4 text-moss" /> {m}
                </li>
              ))}
            </ul>
          )}
          {result.conflicts.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {result.conflicts.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-foreground/90">
                  <AlertTriangle className="h-4 w-4 text-accent" /> {c}
                </li>
              ))}
            </ul>
          )}
          {result.sampleFirst && (
            <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Not certain? A sample is the low-risk way to find out how it wears on you.
            </p>
          )}

          {alts && alts.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Grounded alternatives you might prefer</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {alts.map((c) => (
                  <SmartProductCard key={c.id} card={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label} {hint && <span className="text-xs font-normal text-muted-foreground">({hint})</span>}
      </span>
      {children}
    </label>
  )
}

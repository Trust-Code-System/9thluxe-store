"use client"

import * as React from "react"
import Image from "next/image"
import { Loader2, FlaskConical, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { trackPdp } from "@/lib/analytics/pdp-events"
import { PdpSection } from "./section"

interface Candidate {
  id: string
  slug: string
  name: string
  brand: string | null
  image: string | null
  priceNGN: number
}

interface LayeringAdvice {
  compatibility: "great" | "good" | "experimental"
  sprayOrder: [string, string]
  ratio: string
  warnings: string[]
  note: string
  isGuidance: true
}

const COMPAT_COPY: Record<LayeringAdvice["compatibility"], { label: string; tone: string }> = {
  great: { label: "Layers beautifully", tone: "bg-moss/15 text-moss border-moss/30" },
  good: { label: "Works well", tone: "bg-accent/10 text-accent border-accent/30" },
  experimental: { label: "Experimental", tone: "bg-secondary text-secondary-foreground border-border" },
}

/**
 * Layering Lab. Partner candidates come from the grounded recommender (real, in-catalogue products
 * only). Compatibility is decided by the backend's deterministic editorial rules
 * (/api/v1/layering): results are clearly subjective guidance, never guarantees. Saving a
 * combination and "add both" are gated on backend R6 and shown as a documented, honest state.
 */
export function LayeringLab({
  productId,
  productName,
  family,
}: {
  productId: string
  productName: string
  family: string | null
}) {
  const [candidates, setCandidates] = React.useState<Candidate[] | null>(null)
  const [partner, setPartner] = React.useState<Candidate | null>(null)
  const [advice, setAdvice] = React.useState<LayeringAdvice | null>(null)
  const [tip, setTip] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const params = new URLSearchParams({ limit: "6", ...(family ? { family } : {}) })
    fetch(`/api/v1/recommendations?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        const items = (json.data?.items ?? []) as {
          product: { id: string; slug: string; name: string; brand: string | null; images: string[]; price: { amountNGN: number } }
        }[]
        setCandidates(
          items
            .filter((i) => i.product.id !== productId)
            .map((i) => ({
              id: i.product.id,
              slug: i.product.slug,
              name: i.product.name,
              brand: i.product.brand,
              image: i.product.images?.[0] ?? null,
              priceNGN: i.product.price.amountNGN,
            }))
            .slice(0, 6),
        )
      })
      .catch(() => setCandidates([]))
  }, [productId, family])

  const evaluate = async (p: Candidate) => {
    setPartner(p)
    setAdvice(null)
    setTip(null)
    setLoading(true)
    try {
      const res = await fetch("/api/v1/layering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIdA: productId, productIdB: p.id }),
      })
      const json = await res.json()
      setAdvice(json.data?.advice ?? null)
      setTip(json.data?.tip ?? null)
      trackPdp("layering_recommendation_selected", { productId, partnerId: p.id })
    } catch {
      setAdvice(null)
    } finally {
      setLoading(false)
    }
  }

  // Hide the whole section (header included) when there are no real catalogue partners to layer with.
  if (candidates && candidates.length === 0) return null

  return (
    <PdpSection
      eyebrow="Layering Lab"
      title="Pair it with another"
      description="Layering is personal and subjective. This is editorial guidance for pairings worth trying."
    >
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          Pick a partner to layer with <span className="font-medium text-foreground">{productName}</span>:
        </p>
        {!candidates ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading partners…
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => evaluate(c)}
                  aria-pressed={partner?.id === c.id}
                  className={cn(
                    "flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors",
                    partner?.id === c.id ? "border-accent ring-1 ring-accent" : "border-border hover:border-muted-foreground",
                  )}
                >
                  <span className="relative block aspect-square bg-secondary/40">
                    {c.image ? (
                      <Image src={c.image} alt={c.name} fill sizes="120px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-[10px] text-muted-foreground">No image</span>
                    )}
                  </span>
                  <span className="p-2">
                    <span className="line-clamp-2 text-xs font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatPrice(c.priceNGN)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {!partner ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Layers className="mb-2 h-8 w-8 opacity-40" />
            Choose a fragrance to see how the two might layer.
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Blending…
          </div>
        ) : advice ? (
          <div className="space-y-4">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", COMPAT_COPY[advice.compatibility].tone)}>
              <FlaskConical className="h-3.5 w-3.5" /> {COMPAT_COPY[advice.compatibility].label}
            </span>
            <dl className="space-y-2 text-sm">
              <Row label="Apply first">{advice.sprayOrder[0]}</Row>
              <Row label="Then">{advice.sprayOrder[1]}</Row>
              <Row label="Suggested ratio">{advice.ratio}</Row>
            </dl>
            {tip && <p className="text-sm leading-relaxed text-foreground/90">{tip}</p>}
            <p className="text-sm text-muted-foreground">{advice.note}</p>
            {advice.warnings.length > 0 && (
              <ul className="space-y-1 text-xs text-accent">
                {advice.warnings.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" disabled className="bg-transparent" title="Saving combinations is coming soon">
                Save combination
              </Button>
              <Button variant="outline" size="sm" disabled className="bg-transparent" title="Add-both-to-cart is coming soon">
                Add both to cart
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Layering results are subjective. This is editorial guidance. Saving &amp; add-both arrive with the wardrobe
              update.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Couldn&apos;t evaluate this pairing right now.</p>
        )}
      </div>
    </div>
    </PdpSection>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

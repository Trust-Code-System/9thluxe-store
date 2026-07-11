"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { X, GitCompareArrows } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { formatPrice } from "@/lib/format"
import { useCompareStore } from "@/lib/stores/compare-store"
import { cn } from "@/lib/utils"

interface Enriched {
  slug: string
  notesTop: string | null
  notesHeart: string | null
  notesBase: string | null
  longevity: string | null
  sillage: string | null
  concentration: string | null
  fragranceFamily: string | null
  pricePerMl: number | null
}

/**
 * Dedicated comparison page (up to 4). Reads the persisted compare store and enriches each item with
 * its real public product data. Rows that are identical across all items are de-emphasised so
 * meaningful DIFFERENCES stand out rather than a flat raw table. Fully responsive: horizontal scroll
 * with a sticky attribute column on small screens.
 */
export default function ComparePage() {
  const items = useCompareStore((s) => s.items)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const [enriched, setEnriched] = React.useState<Record<string, Enriched>>({})
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    let cancelled = false
    Promise.all(
      items.map(async (it) => {
        try {
          const res = await fetch(`/api/v1/products/${encodeURIComponent(it.slug)}`)
          if (!res.ok) return null
          const json = await res.json()
          const p = json.data
          const variant = p?.variants?.[0]
          const size: string | null = variant?.size ?? null
          const ml = size ? Number((size.match(/(\d+(?:\.\d+)?)\s*ml/i) || [])[1]) : NaN
          return [
            it.slug,
            {
              slug: it.slug,
              notesTop: p?.notesTop ?? null,
              notesHeart: p?.notesHeart ?? null,
              notesBase: p?.notesBase ?? null,
              longevity: p?.longevity ?? null,
              sillage: p?.sillage ?? null,
              concentration: p?.concentration ?? null,
              fragranceFamily: p?.fragranceFamily ?? null,
              pricePerMl: Number.isFinite(ml) && ml > 0 ? Math.round(it.priceNGN / ml) : null,
            } as Enriched,
          ] as const
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, Enriched> = {}
      for (const r of results) if (r) map[r[0]] = r[1]
      setEnriched(map)
    })
    return () => {
      cancelled = true
    }
  }, [items])

  // Pre-mount skeleton renders identically on the server and the first client paint (the persisted
  // compare store only hydrates after mount), so the page always has an h1 without a flash of the
  // wrong state or a hydration mismatch.
  if (!mounted) {
    return (
      <MainLayout>
        <div
          aria-busy="true"
          className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center"
        >
          <GitCompareArrows className="h-10 w-10 text-muted-foreground opacity-40" />
          <h1 className="font-serif text-2xl">Compare fragrances</h1>
          <p className="max-w-md text-sm text-muted-foreground">Loading your comparison…</p>
        </div>
      </MainLayout>
    )
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <GitCompareArrows className="h-10 w-10 text-muted-foreground opacity-40" />
          <h1 className="font-serif text-2xl">Nothing to compare yet</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Add fragrances to your comparison from any product to see them side by side.
          </p>
          <Link href="/shop" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            Browse fragrances
          </Link>
        </div>
      </MainLayout>
    )
  }

  const val = (slug: string, key: keyof Enriched): string => {
    const e = enriched[slug]
    const v = e ? e[key] : null
    return v == null || v === "" ? "N/A" : String(v)
  }

  const rows: { label: string; render: (slug: string, priceNGN: number) => React.ReactNode; key?: keyof Enriched }[] = [
    { label: "Price", render: (_s, price) => formatPrice(price) },
    { label: "Price / ml", render: (s) => (enriched[s]?.pricePerMl ? formatPrice(enriched[s].pricePerMl as number) : "N/A") },
    { label: "Concentration", key: "concentration", render: (s) => val(s, "concentration") },
    {
      label: "Family",
      key: "fragranceFamily",
      render: (s) => <span className="capitalize">{val(s, "fragranceFamily").toLowerCase()}</span>,
    },
    { label: "Top notes", key: "notesTop", render: (s) => val(s, "notesTop") },
    { label: "Heart notes", key: "notesHeart", render: (s) => val(s, "notesHeart") },
    { label: "Base notes", key: "notesBase", render: (s) => val(s, "notesBase") },
    { label: "Longevity", key: "longevity", render: (s) => val(s, "longevity") },
    { label: "Sillage", key: "sillage", render: (s) => val(s, "sillage") },
  ]

  const sameAcross = (key?: keyof Enriched) => {
    if (!key) return false
    const vals = items.map((it) => enriched[it.slug]?.[key] ?? null)
    return vals.every((v) => v === vals[0]) && vals[0] != null
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-2xl md:text-3xl">Compare fragrances</h1>
          <button type="button" onClick={clear} className="text-sm text-muted-foreground underline">
            Clear all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background" />
                {items.map((it) => (
                  <th key={it.id} className="p-3 align-top">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-secondary/40">
                        {it.image && <Image src={it.image} alt={it.name} fill sizes="112px" className="object-cover" />}
                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          aria-label={`Remove ${it.name}`}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {it.brand && <span className="text-[10px] uppercase tracking-wide text-accent">{it.brand}</span>}
                      <Link href={`/product/${it.slug}`} className="line-clamp-2 text-xs font-medium hover:underline">
                        {it.name}
                      </Link>
                      {it.ratingCount > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {it.ratingAvg.toFixed(1)}★ ({it.ratingCount})
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const identical = sameAcross(row.key)
                return (
                  <tr key={row.label} className="border-t border-border">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-background p-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {row.label}
                    </th>
                    {items.map((it) => (
                      <td
                        key={it.id}
                        className={cn(
                          "p-3 text-center align-top",
                          identical ? "text-muted-foreground" : "font-medium text-foreground",
                        )}
                      >
                        {row.render(it.slug, it.priceNGN)}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr className="border-t border-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-background p-3 text-left text-xs font-medium text-muted-foreground"
                >
                  Sample
                </th>
                {items.map((it) => (
                  <td key={it.id} className="p-3 text-center">
                    {it.hasSample ? "Available" : "N/A"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-background p-3 text-left text-xs font-medium text-muted-foreground"
                >
                  Availability
                </th>
                {items.map((it) => (
                  <td key={it.id} className="p-3 text-center capitalize">
                    {it.availability.replace(/_/g, " ")}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Rows where every fragrance matches are dimmed so the differences stand out. Some attributes may show
          &ldquo;N/A&rdquo; where the brand hasn&apos;t supplied that detail yet.
        </p>
      </div>
    </MainLayout>
  )
}

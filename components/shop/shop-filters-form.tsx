"use client"

import * as React from "react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

/** Radix Select does not allow value=""; use sentinel and map to "" for form submit */
const EMPTY = "__all__"

const NOTE_OPTIONS = [
  { value: EMPTY, label: "Any scent" },
  { value: "oud", label: "Oud" },
  { value: "rose", label: "Rose" },
  { value: "citrus", label: "Citrus" },
  { value: "vanilla", label: "Vanilla" },
  { value: "woody", label: "Woody" },
  { value: "amber", label: "Amber" },
  { value: "sandalwood", label: "Sandalwood" },
  { value: "bergamot", label: "Bergamot" },
  { value: "patchouli", label: "Patchouli" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price low → high" },
  { value: "price_desc", label: "Price high → low" },
  { value: "best_selling", label: "Best selling" },
]

const FAMILY_OPTIONS = [
  { value: EMPTY, label: "Any family" },
  { value: "CITRUS", label: "Citrus" },
  { value: "WOODY", label: "Woody" },
  { value: "FLORAL", label: "Floral" },
  { value: "ORIENTAL", label: "Oriental" },
  { value: "FRESH", label: "Fresh" },
  { value: "SPICY", label: "Spicy" },
  { value: "GOURMAND", label: "Gourmand" },
]

type ShopFiltersFormProps = {
  params: {
    category?: string
    brand?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    note?: string
    q?: string
    family?: string
  }
  brands: string[]
}

const formInputBase =
  "flex h-11 w-full items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-4 text-sm text-foreground shadow-sm transition-colors hover:bg-muted/60 focus:border-primary focus:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&>svg]:text-muted-foreground"

function toFormValue(v: string): string {
  return v === EMPTY ? "" : v
}

export function ShopFiltersForm({ params, brands }: ShopFiltersFormProps) {
  const [category, setCategory] = React.useState(params.category && params.category !== "" ? params.category : EMPTY)
  const [brand, setBrand] = React.useState(params.brand && params.brand !== "" ? params.brand : EMPTY)
  const [note, setNote] = React.useState(params.note && params.note !== "" ? params.note : EMPTY)
  const [family, setFamily] = React.useState(params.family && params.family !== "" ? params.family : EMPTY)
  const [sort, setSort] = React.useState(params.sort || "newest")

  return (
    <form
      className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-[0_20px_50px_-30px_rgba(33,24,19,0.4)] md:grid-cols-[0.9fr,1.1fr]"
      method="get"
    >
      {params.q && <input type="hidden" name="q" value={params.q} />}
      <input type="hidden" name="category" value={toFormValue(category)} />
      <input type="hidden" name="brand" value={toFormValue(brand)} />
      <input type="hidden" name="note" value={toFormValue(note)} />
      <input type="hidden" name="family" value={toFormValue(family)} />
      <input type="hidden" name="sort" value={sort} />

      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Category
        </label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className={formInputBase}>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value={EMPTY}>All</SelectItem>
            <SelectItem value="perfumes">Perfumes</SelectItem>
          </SelectContent>
        </Select>

        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Brand
        </label>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className={formInputBase}>
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value={EMPTY}>All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Scent / Note
        </label>
        <Select value={note} onValueChange={setNote}>
          <SelectTrigger className={formInputBase}>
            <SelectValue placeholder="Any scent" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {NOTE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Fragrance Family
        </label>
        <Select value={family} onValueChange={setFamily}>
          <SelectTrigger className={formInputBase}>
            <SelectValue placeholder="Any family" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {FAMILY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="min-price" className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Min price (₦)
            </label>
            <Input
              id="min-price"
              name="minPrice"
              type="number"
              defaultValue={params.minPrice || ""}
              min={0}
              placeholder="e.g. 10000"
              aria-label="Minimum price in naira"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Max price (₦)
            </label>
            <Input
              id="max-price"
              name="maxPrice"
              type="number"
              defaultValue={params.maxPrice || ""}
              min={0}
              placeholder="e.g. 500000"
              aria-label="Maximum price in naira"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Sort
        </label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className={formInputBase}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl border-0 bg-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Apply
          </button>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3.5 text-sm font-medium uppercase tracking-wider text-foreground shadow-sm transition-colors hover:bg-muted hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Reset filters
          </Link>
        </div>
      </div>
    </form>
  )
}

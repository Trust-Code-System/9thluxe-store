"use client";

import * as React from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberField } from "@/components/ui/number-field";

/** Radix Select does not allow value=""; use sentinel and map to "" for form submit */
const EMPTY = "__all__";

const NOTE_OPTIONS = [
  { value: EMPTY, label: "Any note" },
  { value: "oud", label: "Oud" },
  { value: "rose", label: "Rose" },
  { value: "jasmine", label: "Jasmine" },
  { value: "citrus", label: "Citrus" },
  { value: "vanilla", label: "Vanilla" },
  { value: "woody", label: "Woody" },
  { value: "amber", label: "Amber" },
  { value: "sandalwood", label: "Sandalwood" },
  { value: "bergamot", label: "Bergamot" },
  { value: "patchouli", label: "Patchouli" },
  { value: "musk", label: "Musk" },
  { value: "leather", label: "Leather" },
  { value: "vetiver", label: "Vetiver" },
  { value: "saffron", label: "Saffron" },
  { value: "lavender", label: "Lavender" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price low → high" },
  { value: "price_desc", label: "Price high → low" },
  { value: "best_selling", label: "Best selling" },
];

const FAMILY_OPTIONS = [
  { value: EMPTY, label: "Any family" },
  { value: "CITRUS", label: "Citrus" },
  { value: "WOODY", label: "Woody" },
  { value: "FLORAL", label: "Floral" },
  { value: "ORIENTAL", label: "Oriental" },
  { value: "FRESH", label: "Fresh" },
  { value: "SPICY", label: "Spicy" },
  { value: "GOURMAND", label: "Gourmand" },
];

type ShopFiltersFormProps = {
  params: {
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    note?: string;
    q?: string;
    family?: string;
  };
  brands: string[];
};

const triggerStyle =
  "h-11 w-full rounded-none border-0 border-b border-border bg-transparent px-3 text-sm text-foreground transition-colors hover:border-accent focus:border-accent focus:outline-none focus:ring-0 focus-visible:ring-0 [&>span]:line-clamp-1 [&>span]:flex-1 [&>span]:text-center [&>svg]:ml-2 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

const inputStyle = "h-full border-0 bg-transparent shadow-none";

const fieldLabel =
  "font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground";

function toFormValue(v: string): string {
  return v === EMPTY ? "" : v;
}

export function ShopFiltersForm({ params, brands }: ShopFiltersFormProps) {
  const [brand, setBrand] = React.useState(
    params.brand && params.brand !== "" ? params.brand : EMPTY,
  );
  const [note, setNote] = React.useState(
    params.note && params.note !== "" ? params.note : EMPTY,
  );
  const [family, setFamily] = React.useState(
    params.family && params.family !== "" ? params.family : EMPTY,
  );
  const [sort, setSort] = React.useState(params.sort || "newest");

  return (
    <form
      method="get"
      className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_1fr_auto]"
    >
      {params.q && <input type="hidden" name="q" value={params.q} />}
      <input type="hidden" name="brand" value={toFormValue(brand)} />
      <input type="hidden" name="note" value={toFormValue(note)} />
      <input type="hidden" name="family" value={toFormValue(family)} />
      <input type="hidden" name="sort" value={sort} />

      <div className="space-y-1.5">
        <label htmlFor="filter-family" className={fieldLabel}>
          Family
        </label>
        <Select value={family} onValueChange={setFamily}>
          <SelectTrigger id="filter-family" className={triggerStyle}>
            <SelectValue placeholder="Any family" />
          </SelectTrigger>
          <SelectContent
            data-surface="day"
            className="border-border bg-popover text-popover-foreground"
          >
            {FAMILY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-note" className={fieldLabel}>
          Note
        </label>
        <Select value={note} onValueChange={setNote}>
          <SelectTrigger id="filter-note" className={triggerStyle}>
            <SelectValue placeholder="Any note" />
          </SelectTrigger>
          <SelectContent
            data-surface="day"
            className="border-border bg-popover text-popover-foreground"
          >
            {NOTE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-brand" className={fieldLabel}>
          Brand
        </label>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger id="filter-brand" className={triggerStyle}>
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent
            data-surface="day"
            className="border-border bg-popover text-popover-foreground"
          >
            <SelectItem value={EMPTY}>All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="min-price" className={fieldLabel}>
          Min ₦
        </label>
        <NumberField
          id="min-price"
          name="minPrice"
          defaultValue={params.minPrice || ""}
          min={0}
          step={10000}
          placeholder="0"
          aria-label="Minimum price in naira"
          className={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="max-price" className={fieldLabel}>
          Max ₦
        </label>
        <NumberField
          id="max-price"
          name="maxPrice"
          defaultValue={params.maxPrice || ""}
          min={0}
          step={10000}
          placeholder="Any"
          aria-label="Maximum price in naira"
          className={inputStyle}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-sort" className={fieldLabel}>
          Sort
        </label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger id="filter-sort" className={triggerStyle}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            data-surface="day"
            className="border-border bg-popover text-popover-foreground"
          >
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 space-y-1.5 sm:col-span-3 lg:col-span-1">
        <span
          className={`${fieldLabel} invisible select-none`}
          aria-hidden="true"
        >
          Apply
        </span>
        <div className="flex h-11 items-center gap-4">
          <button
            type="submit"
            className="inline-flex h-11 cursor-pointer items-center justify-center bg-primary px-7 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Apply
          </button>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            Reset
          </Link>
        </div>
      </div>
    </form>
  );
}

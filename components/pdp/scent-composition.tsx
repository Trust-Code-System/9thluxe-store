"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "./reveal"
import { IngredientArt } from "./ingredient-art"
import { IngredientDetailDialog } from "./ingredient-detail"
import { ProminenceBadge } from "./accord-prominence"
import { PROMINENCE_LABEL } from "@/lib/fragrance/enrich"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { ScentComposition as ScentCompositionData, CompositionNote, TemplateId } from "@/lib/fragrance/types"

const TIER_LABEL: Record<CompositionNote["tier"], string> = {
  top: "Top",
  heart: "Heart",
  base: "Base",
}
const TIER_WINDOW: Record<CompositionNote["tier"], string> = {
  top: "First impression",
  heart: "The character",
  base: "The lasting signature",
}

/** matchMedia hook, SSR-safe (starts false, resolves after mount). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [query])
  return matches
}

function noteName(note: CompositionNote): string {
  return note.match.ingredient?.displayName ?? note.match.input.trim()
}
function noteShort(note: CompositionNote): string | null {
  return note.match.ingredient?.shortDescription ?? null
}

/**
 * The visual scent-composition hero. Chooses one of four templates (admin recommendation, honoured
 * unless the viewer prefers reduced motion or is on a dense mobile layout, where the clean grid wins).
 * Every ingredient is an interactive control usable by mouse, touch, keyboard and screen readers, and
 * a visually-hidden structured note list guarantees the information is never image- or colour-only.
 * The whole block hides gracefully when there is nothing to show.
 */
export function ScentComposition({
  composition,
  bottleImage,
  productName,
  productId,
  template,
  forceViewport,
}: {
  composition: ScentCompositionData
  bottleImage: string | null
  productName: string
  productId: string
  /** Optional admin override; otherwise the recommended template is used. */
  template?: TemplateId
  /** Admin preview only: force the mobile or desktop layout regardless of the real viewport. */
  forceViewport?: "mobile" | "desktop"
}) {
  const reduced = usePrefersReducedMotion()
  const viewportIsMobile = useMediaQuery("(max-width: 640px)")
  const isMobile = forceViewport ? forceViewport === "mobile" : viewportIsMobile
  const [selected, setSelected] = React.useState<CompositionNote | null>(null)

  if (composition.notes.length === 0) return null

  const requested: TemplateId = template ?? composition.recommendedTemplate
  const dense = composition.notes.length > 8
  // Reduced motion always gets the calm grid. Dense mobile also collapses to the grid.
  const effective: TemplateId = reduced || (isMobile && dense) ? "educational_grid" : requested

  const open = (note: CompositionNote) => {
    setSelected(note)
    trackPdp("ingredient_opened", {
      productId,
      note: note.match.ingredient?.canonicalName ?? note.match.input,
    })
  }

  const byTier = {
    top: composition.notes.filter((n) => n.tier === "top"),
    heart: composition.notes.filter((n) => n.tier === "heart"),
    base: composition.notes.filter((n) => n.tier === "base"),
  }

  return (
    <div>
      <ScreenReaderNoteList composition={composition} productName={productName} />

      <div aria-hidden={false}>
        {effective === "educational_grid" && <EducationalGrid notes={composition.gallery} onOpen={open} />}
        {effective === "vertical_note" && (
          <VerticalNote byTier={byTier} bottleImage={bottleImage} productName={productName} onOpen={open} />
        )}
        {effective === "ingredient_environment" && (
          <IngredientEnvironment byTier={byTier} bottleImage={bottleImage} productName={productName} onOpen={open} />
        )}
        {effective === "accord_spotlight" && (
          <AccordSpotlight composition={composition} bottleImage={bottleImage} productName={productName} onOpen={open} />
        )}
      </div>

      <IngredientDetailDialog
        note={selected}
        productName={productName}
        productId={productId}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

/* ----------------------------------------------------------------------------------------------- */
/* Interactive ingredient control, reused by every template.                                        */
/* ----------------------------------------------------------------------------------------------- */

function IngredientButton({
  note,
  onOpen,
  size = 88,
  variant = "chip",
}: {
  note: CompositionNote
  onOpen: (n: CompositionNote) => void
  size?: number
  variant?: "chip" | "bare"
}) {
  const name = noteName(note)
  const hasDetail = note.match.ingredient != null
  return (
    <button
      type="button"
      onClick={() => onOpen(note)}
      aria-label={`${name}, ${TIER_LABEL[note.tier].toLowerCase()} note, ${PROMINENCE_LABEL[
        note.prominence
      ].toLowerCase()} prominence. ${hasDetail ? "View details." : "Not in ingredient library."}`}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "chip" && "hover:bg-secondary/60",
      )}
    >
      <span
        className="grid place-items-center rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        style={{ width: size, height: size }}
      >
        <IngredientArt note={note} size={size} />
      </span>
      <span className="max-w-[8rem] text-xs font-medium leading-tight text-foreground">{name}</span>
    </button>
  )
}

/* ----------------------------------------------------------------------------------------------- */
/* Template 4: Educational grid (also the mobile / reduced-motion default).                          */
/* ----------------------------------------------------------------------------------------------- */

function EducationalGrid({ notes, onOpen }: { notes: CompositionNote[]; onOpen: (n: CompositionNote) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {notes.map((note, i) => {
        const short = noteShort(note)
        return (
          <li key={`${note.match.input}-${i}`}>
            <button
              type="button"
              onClick={() => onOpen(note)}
              aria-label={`${noteName(note)}, ${TIER_LABEL[note.tier].toLowerCase()} note. View details.`}
              className="flex h-full w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 p-4 text-center transition-colors hover:border-accent/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IngredientArt note={note} size={80} />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">{noteName(note)}</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  {TIER_LABEL[note.tier]}
                </span>
                {short && <span className="block text-xs leading-snug text-muted-foreground">{short}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ----------------------------------------------------------------------------------------------- */
/* A tier row: horizontally swipeable on small screens, wrapped on large.                            */
/* ----------------------------------------------------------------------------------------------- */

function TierRow({
  tier,
  notes,
  onOpen,
  size,
}: {
  tier: CompositionNote["tier"]
  notes: CompositionNote[]
  onOpen: (n: CompositionNote) => void
  size?: number
}) {
  if (notes.length === 0) return null
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{TIER_LABEL[tier]}</span>
        <span className="text-[11px] text-muted-foreground">{TIER_WINDOW[tier]}</span>
      </div>
      <div className="flex snap-x snap-mandatory justify-start gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {notes.map((note, i) => (
          <div key={`${note.match.input}-${i}`} className="shrink-0 snap-center">
            <IngredientButton note={note} onOpen={onOpen} size={size ?? 76} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Bottle({ image, productName, className }: { image: string | null; productName: string; className?: string }) {
  if (!image) return null
  return (
    <img
      src={image}
      alt={`${productName} bottle`}
      className={cn("mx-auto h-auto w-full max-w-[200px] object-contain drop-shadow-xl", className)}
      loading="lazy"
      decoding="async"
    />
  )
}

/* ----------------------------------------------------------------------------------------------- */
/* Template 1: Vertical note composition. Ingredients stacked above the real bottle.                 */
/* ----------------------------------------------------------------------------------------------- */

function VerticalNote({
  byTier,
  bottleImage,
  productName,
  onOpen,
}: {
  byTier: Record<CompositionNote["tier"], CompositionNote[]>
  bottleImage: string | null
  productName: string
  onOpen: (n: CompositionNote) => void
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
      <TierRow tier="top" notes={byTier.top} onOpen={onOpen} />
      <Connector />
      <TierRow tier="heart" notes={byTier.heart} onOpen={onOpen} />
      <Connector />
      <TierRow tier="base" notes={byTier.base} onOpen={onOpen} />
      {bottleImage && (
        <>
          <Connector />
          <Bottle image={bottleImage} productName={productName} />
        </>
      )}
    </div>
  )
}

function Connector() {
  return <span aria-hidden className="h-6 w-px bg-gradient-to-b from-border to-transparent" />
}

/* ----------------------------------------------------------------------------------------------- */
/* Template 2: Ingredient environment. Bottle centred, ingredients surrounding by tier.              */
/* ----------------------------------------------------------------------------------------------- */

function IngredientEnvironment({
  byTier,
  bottleImage,
  productName,
  onOpen,
}: {
  byTier: Record<CompositionNote["tier"], CompositionNote[]>
  bottleImage: string | null
  productName: string
  onOpen: (n: CompositionNote) => void
}) {
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-b from-secondary/40 to-transparent p-5 sm:p-8">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-6">
          <TierRow tier="top" notes={byTier.top} onOpen={onOpen} size={72} />
          <TierRow tier="heart" notes={byTier.heart} onOpen={onOpen} size={72} />
        </div>
        <div className="order-first lg:order-none">
          <Bottle image={bottleImage} productName={productName} />
        </div>
        <div>
          <TierRow tier="base" notes={byTier.base} onOpen={onOpen} size={72} />
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------------------------- */
/* Template 3: Accord spotlight. Cinematic, the dominant accords lead with short descriptions.       */
/* ----------------------------------------------------------------------------------------------- */

function AccordSpotlight({
  composition,
  bottleImage,
  productName,
  onOpen,
}: {
  composition: ScentCompositionData
  bottleImage: string | null
  productName: string
  onOpen: (n: CompositionNote) => void
}) {
  const lead = composition.accords.slice(0, 5)
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/60 via-card to-card p-6 sm:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="order-2 space-y-4 lg:order-1">
          {lead.map((accord) => (
            <div key={accord.slug} className="border-l-2 pl-4" style={{ borderColor: accord.color }}>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg capitalize">{accord.name}</span>
                <ProminenceBadge label={accord.label} />
              </div>
            </div>
          ))}
          {composition.gallery.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {composition.gallery.slice(0, 6).map((note, i) => (
                <IngredientButton key={`${note.match.input}-${i}`} note={note} onOpen={onOpen} size={56} variant="bare" />
              ))}
            </div>
          )}
        </div>
        <div className="order-1 lg:order-2">
          <Bottle image={bottleImage} productName={productName} className="max-w-[240px]" />
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------------------------- */
/* Non-visual, screen-reader-only structured note list. Guarantees WCAG 1.1.1 / 1.4.1 compliance.    */
/* ----------------------------------------------------------------------------------------------- */

function ScreenReaderNoteList({
  composition,
  productName,
}: {
  composition: ScentCompositionData
  productName: string
}) {
  const tiers: CompositionNote["tier"][] = ["top", "heart", "base"]
  return (
    <div className="sr-only">
      <h3>{productName} fragrance notes</h3>
      {tiers.map((tier) => {
        const notes = composition.notes.filter((n) => n.tier === tier)
        if (notes.length === 0) return null
        return (
          <div key={tier}>
            <h4>{TIER_LABEL[tier]} notes</h4>
            <ul>
              {notes.map((n, i) => (
                <li key={`${n.match.input}-${i}`}>
                  {noteName(n)} ({PROMINENCE_LABEL[n.prominence].toLowerCase()} prominence)
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

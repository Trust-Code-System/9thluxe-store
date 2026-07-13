"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OrbitData, OrbitSlideData } from "@/lib/hero/orbit"

/**
 * The orbital perfume showcase (client island). One coordinated timeline drives everything:
 * a single dwell timer advances the active slide; the slot-to-slot movement is a one-shot Web
 * Animations API run per bottle (elliptical arc via a mid keyframe), so there is NO continuous
 * requestAnimationFrame loop. The first render is deterministic (slide 0 front) and is part of the
 * server HTML. Rotation pauses on hover/focus, off-viewport and hidden tab, and never starts under
 * prefers-reduced-motion (static composition, full information, working actions - no content loss).
 * On small screens the full orbit is replaced by a simplified single-bottle crossfade with swipe
 * and accessible dots.
 */

type Mode = "orbit" | "simple"

/** Ellipse geometry: percentage offsets of the stage box. */
const ELLIPSE_X = 36 // horizontal radius
const ELLIPSE_Y = 4 // vertical lift toward the back
const EASING = "cubic-bezier(0.55, 0.06, 0.22, 0.99)"
const RESUME_DELAY_MS = 1_500

interface SlotStyle {
  x: number
  y: number
  scale: number
  opacity: number
  blur: number
  z: number
}

/** Continuous style along the orbit. theta 0 = front, PI = rear. */
function styleAt(theta: number): SlotStyle {
  const depth = Math.cos(theta) // 1 front, -1 rear
  const t = (depth + 1) / 2
  return {
    x: Math.sin(theta) * ELLIPSE_X,
    y: (1 - depth) * -ELLIPSE_Y,
    scale: 0.66 + t * 0.4,
    opacity: 0.25 + t * 0.75,
    blur: (1 - t) * 2.5,
    z: 10 + Math.round(t * 20),
  }
}

function slotTheta(index: number, active: number, n: number): number {
  const offset = (((index - active) % n) + n) % n
  // With two slides a diametric rear slot (180deg) hides exactly behind the front bottle; rest it
  // at ~130deg instead so the waiting perfume stays visible to the right-back (brief requirement).
  if (n === 2) return offset === 0 ? 0 : Math.PI * 0.72
  return (offset * 2 * Math.PI) / n
}

function cssFor(s: SlotStyle, blurEnabled: boolean): React.CSSProperties {
  return {
    transform: `translate3d(${s.x}%, ${s.y}%, 0) scale(${s.scale})`,
    opacity: s.opacity,
    filter: blurEnabled && s.blur > 0.05 ? `blur(${s.blur.toFixed(2)}px)` : "none",
    zIndex: s.z,
  }
}

/** Fixed on-stage positions (percent) for up to five ingredient visuals around the bottle. */
const INGREDIENT_SLOTS = [
  { x: 12, y: 22 },
  { x: 88, y: 30 },
  { x: 8, y: 56 },
  { x: 90, y: 62 },
  { x: 50, y: 6 },
] as const

/** Where the annotation card's connector starts (percent of the stage box). */
const ANNOTATION_ANCHOR = { x: 26, y: 84 } as const

export function OrbitRotator({
  slides,
  motion,
}: {
  slides: OrbitSlideData[]
  motion: OrbitData["motion"]
}) {
  const n = slides.length
  const [active, setActive] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const [mode, setMode] = React.useState<Mode>("orbit")
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [paused, setPaused] = React.useState(false)

  const regionRef = React.useRef<HTMLDivElement>(null)
  const bottleRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = React.useRef(0)
  const hoverPauseRef = React.useRef(false)
  const hiddenPauseRef = React.useRef(false)
  const offscreenPauseRef = React.useRef(false)
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const swipeStartRef = React.useRef<number | null>(null)

  const syncPaused = React.useCallback(() => {
    setPaused(hoverPauseRef.current || hiddenPauseRef.current || offscreenPauseRef.current)
  }, [])

  // Environment: reduced motion + simplified mode on small screens.
  React.useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sm = window.matchMedia("(max-width: 767px)")
    const syncRm = () => setReducedMotion(rm.matches)
    const syncSm = () => setMode(sm.matches ? "simple" : "orbit")
    syncRm()
    syncSm()
    rm.addEventListener("change", syncRm)
    sm.addEventListener("change", syncSm)
    return () => {
      rm.removeEventListener("change", syncRm)
      sm.removeEventListener("change", syncSm)
    }
  }, [])

  // Pause when the tab is hidden or the hero leaves the viewport.
  React.useEffect(() => {
    const onVisibility = () => {
      hiddenPauseRef.current = document.hidden
      syncPaused()
    }
    document.addEventListener("visibilitychange", onVisibility)
    const node = regionRef.current
    let observer: IntersectionObserver | null = null
    if (node && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          offscreenPauseRef.current = !entries.some((e) => e.isIntersecting)
          syncPaused()
        },
        { threshold: 0.2 },
      )
      observer.observe(node)
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      observer?.disconnect()
    }
  }, [syncPaused])

  // The single coordinated timeline: one dwell timer per rotation.
  React.useEffect(() => {
    if (reducedMotion || paused || n < 2) return
    const timer = setTimeout(() => {
      prevActiveRef.current = active
      setCycle((c) => c + 1)
      setActive((a) => (a + 1) % n)
    }, motion.dwellMs + motion.transitionMs)
    return () => clearTimeout(timer)
  }, [active, paused, reducedMotion, n, motion.dwellMs, motion.transitionMs])

  // Slot-to-slot movement: a one-shot WAAPI run per bottle with a mid keyframe on the ellipse.
  React.useLayoutEffect(() => {
    const prev = prevActiveRef.current
    prevActiveRef.current = active
    if (prev === active || reducedMotion || mode !== "orbit") return
    if (typeof Element === "undefined" || !Element.prototype.animate) return
    let delta = (((active - prev) % n) + n) % n
    if (n > 2 && delta > n / 2) delta -= n
    // Every bottle travels the SAME orbital direction (advance = counter-clockwise), so paths never
    // cross: with two slides the outgoing front takes the long left-back arc while the incoming
    // bottle glides forward from the right. styleAt() is periodic, so overshooting 2*PI is safe.
    const dir = delta >= 0 ? -1 : 1
    slides.forEach((_, i) => {
      const el = bottleRefs.current[i]
      if (!el) return
      const fromTheta = slotTheta(i, prev, n)
      const toTheta = slotTheta(i, active, n)
      let travel = toTheta - fromTheta
      if (dir < 0 && travel > 0) travel -= 2 * Math.PI
      if (dir > 0 && travel < 0) travel += 2 * Math.PI
      el.animate(
        [
          cssFor(styleAt(fromTheta), true),
          cssFor(styleAt(fromTheta + travel / 2), true),
          cssFor(styleAt(fromTheta + travel), true),
        ] as unknown as Keyframe[],
        { duration: motion.transitionMs, easing: EASING },
      )
    })
  }, [active, mode, n, reducedMotion, slides, motion.transitionMs])

  const pauseForInteraction = React.useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    hoverPauseRef.current = true
    syncPaused()
  }, [syncPaused])

  const resumeAfterDelay = React.useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      hoverPauseRef.current = false
      syncPaused()
    }, RESUME_DELAY_MS)
  }, [syncPaused])

  React.useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    },
    [],
  )

  const goTo = React.useCallback(
    (index: number) => {
      prevActiveRef.current = active
      setCycle((c) => c + 1)
      setActive(((index % n) + n) % n)
    },
    [active, n],
  )

  // Swipe navigation (simplified mode).
  const onPointerDown = (e: React.PointerEvent) => {
    if (mode !== "simple") return
    swipeStartRef.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (mode !== "simple" || swipeStartRef.current == null) return
    const dx = e.clientX - swipeStartRef.current
    swipeStartRef.current = null
    if (Math.abs(dx) > 42) goTo(active + (dx < 0 ? 1 : -1))
  }

  const slide = slides[active]
  const maxIngredients = mode === "simple" ? 3 : 5
  const ingredients = slide.ingredients.slice(0, maxIngredients)
  const annotation =
    slide.annotations.length > 0
      ? slide.annotations[cycle % slide.annotations.length]
      : null
  const annotationSlot = annotation
    ? INGREDIENT_SLOTS[
        Math.max(
          0,
          ingredients.findIndex((i) => i.id === annotation.ingredientId),
        ) % INGREDIENT_SLOTS.length
      ]
    : null

  return (
    <div
      ref={regionRef}
      className="relative mx-auto w-full max-w-[min(420px,46svh)]"
      onPointerEnter={pauseForInteraction}
      onPointerLeave={resumeAfterDelay}
      onFocusCapture={pauseForInteraction}
      onBlurCapture={resumeAfterDelay}
    >
      {/* Stage */}
      <div
        className="relative aspect-[4/5] w-full touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* Ambient light + shared water surface (theme-aware) */}
        <div aria-hidden className="pedestal-light absolute -inset-10" />
        <div
          aria-hidden
          className="hero-water absolute inset-x-0 bottom-0 h-[34%] rounded-[50%/22%]"
        >
          <div className="hero-water-ring absolute inset-x-[18%] top-[26%] h-[40%] rounded-[50%]" />
        </div>

        {/* Bottles on the orbit (or single crossfading bottle in simplified mode) */}
        {slides.map((s, i) => {
          const isActive = i === active
          if (mode === "simple" && !isActive) return null
          // Simple mode: identity transform (the crossfade keyframes end at identity).
          const style =
            mode === "simple"
              ? ({ zIndex: 30 } as React.CSSProperties)
              : cssFor(styleAt(slotTheta(i, active, n)), true)
          return (
            <div
              key={mode === "simple" ? `${s.id}-simple` : s.id}
              ref={(el) => {
                bottleRefs.current[i] = el
              }}
              aria-hidden={!isActive}
              style={style}
              className={cn(
                "absolute inset-0 will-change-transform",
                mode === "simple" && "orbit-simple-enter",
              )}
            >
              <div className="absolute inset-x-0 bottom-[10%] top-0 flex items-end justify-center">
                <div className="relative flex flex-col items-center">
                  <img
                    src={s.bottleAsset}
                    alt={isActive ? s.product.alt : ""}
                    width={340}
                    height={560}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                    className="h-[clamp(220px,38vh,380px)] w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)]"
                  />
                  {/* Circular display pedestal + contact shadow beneath each bottle */}
                  <div
                    aria-hidden
                    className="hero-contact-shadow -mt-2 h-3 w-[46%] rounded-[100%] blur-md"
                  />
                  <div aria-hidden className="hero-pedestal -mt-1 h-5 w-[72%] rounded-[50%]" />
                </div>
              </div>
            </div>
          )
        })}

        {/* Ingredient scene: ONLY the active front perfume, remounted per slide (aria-hidden;
            the same note data is available textually in the product panel below). */}
        <div key={`${slide.id}-scene`} aria-hidden className="absolute inset-0 z-[32]">
          {ingredients.map((ing, k) => {
            const slot = INGREDIENT_SLOTS[k % INGREDIENT_SLOTS.length]
            return (
              <span
                key={ing.id}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  animationDelay: `${180 + k * 160}ms`,
                }}
                className="orbit-ingredient absolute"
              >
                <img
                  src={mode === "simple" ? ing.artMobile : ing.artDesktop}
                  alt=""
                  width={52}
                  height={52}
                  draggable={false}
                  style={{ animationDelay: `${k * 700}ms` }}
                  className="orbit-ingredient-art h-11 w-11 md:h-13 md:w-13"
                />
              </span>
            )
          })}

          {/* Scent annotation: connector line + editorial label with a restrained typewriter */}
          {annotation && annotationSlot && (
            <div key={annotation.id} className="orbit-annotation absolute inset-0">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1={ANNOTATION_ANCHOR.x}
                  y1={ANNOTATION_ANCHOR.y}
                  x2={annotationSlot.x}
                  y2={annotationSlot.y}
                  className="orbit-connector"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="absolute bottom-[2%] left-[2%] max-w-[240px] border border-border/70 bg-background/85 p-3 backdrop-blur-[2px]">
                <p className="orbit-typewriter font-mono text-[11px] uppercase tracking-[0.28em] text-accent">
                  {annotation.name}
                </p>
                <p className="orbit-annotation-body mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                  {annotation.text}
                </p>
                <p className="orbit-annotation-body mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  {annotation.tier} note · Perceived prominence: {annotation.prominence}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active product information (real data only) */}
      <div key={`${slide.id}-info`} className="orbit-fade-up relative z-[35] mt-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {[slide.product.brand, slide.product.family?.toLowerCase(), slide.product.concentration]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 font-serif text-xl text-foreground">
          {slide.product.name}
          {slide.purchasable && slide.product.availability === "coming_soon" && (
            <span className="ml-3 align-middle font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
              Coming soon
            </span>
          )}
        </p>
        {slide.product.keyNotes.length > 0 && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            {slide.product.keyNotes.join(" · ")}
          </p>
        )}
        {slide.purchasable ? (
          <div className="mt-3 flex items-center justify-center gap-5">
            <Link
              href={`/product/${slide.product.slug}`}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground underline-offset-4 hover:text-accent hover:underline"
            >
              Explore the scent
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {slide.product.availability === "available" && (
              <Link
                href={`/product/${slide.product.slug}`}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
              >
                Shop this fragrance
              </Link>
            )}
          </div>
        ) : (
          // Showcase slide: recognisable fragrance shown as part of the house world, not for sale.
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/80">
            In the Fádé world
          </p>
        )}
      </div>

      {/* Accessible slide navigation */}
      {n > 1 && (
        <div className="relative z-[35] mt-4 flex items-center justify-center gap-3" role="group" aria-label="Featured fragrances">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${s.product.name}`}
              aria-current={i === active}
              className="group grid h-7 w-7 place-items-center"
            >
              <span
                aria-hidden
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-border transition-colors",
                  i === active ? "bg-accent" : "bg-transparent group-hover:bg-accent/40",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

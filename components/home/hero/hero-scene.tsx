"use client"

import * as React from "react"

import type { HeroIngredientAsset, HeroMotionProfile } from "@/lib/hero/types"

/**
 * Decorative ingredient-descent layer. Approved in-house ingredient art falls from varied heights at
 * varied speeds, rotating and drifting, restrained so it never overwhelms the product. Entirely
 * decorative: aria-hidden, and the accessible note information lives in the static server markup.
 *
 * Performance contract:
 *  - a single requestAnimationFrame loop drives every particle
 *  - particle transforms are written straight to the DOM via refs (no per-frame React re-render)
 *  - the loop pauses when the hero scrolls out of view (IntersectionObserver)
 *  - the loop pauses when the tab is hidden (Page Visibility API)
 *  - every frame, observer and listener is cleaned up on unmount
 */

interface Particle {
  x: number // vw-relative 0..100 within the layer
  y: number // px from top
  vy: number // px/sec
  rot: number
  vrot: number // deg/sec
  depth: number // 0 (far) .. 1 (near)
  srcIndex: number
}

const PARTICLE_MAX = 8

export default function HeroScene({
  ingredients,
  motion,
}: {
  ingredients: HeroIngredientAsset[]
  motion: HeroMotionProfile
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const particles = React.useRef<Particle[]>([])
  // DOM nodes kept in a stable array, decoupled from motion state: ref callbacks populate this at
  // commit time, before the seeding effect runs, so nodes are always attached to the loop by index.
  const els = React.useRef<(HTMLImageElement | null)[]>([])
  const rafRef = React.useRef<number | null>(null)
  const lastTs = React.useRef<number>(0)
  const runningRef = React.useRef(false)
  const heightRef = React.useRef(0)
  const parallax = React.useRef({ x: 0, y: 0 })

  // Stable, deterministic pool count so server/client never diverge visually per breakpoint.
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (ingredients.length === 0) return
    const root = rootRef.current
    if (!root) return

    const isMobile = window.matchMedia("(max-width: 640px)").matches
    const target = Math.min(
      isMobile ? motion.mobileParticles : motion.desktopParticles,
      PARTICLE_MAX,
    )
    setCount(target)
  }, [ingredients.length, motion.desktopParticles, motion.mobileParticles])

  React.useEffect(() => {
    if (count === 0 || ingredients.length === 0) return
    const root = rootRef.current
    if (!root) return

    const rand = mulberry32(0x5eed ^ count)
    const measure = () => {
      heightRef.current = root.getBoundingClientRect().height || 480
    }
    measure()

    // Seed particles spread across the vertical travel so the loop starts mid-flight (no empty gap).
    particles.current = Array.from({ length: count }).map((_, i) => {
      const depth = 0.35 + rand() * 0.65
      return {
        x: 8 + rand() * 84,
        y: (heightRef.current + 120) * rand() - 60,
        vy: 26 + depth * 42, // near particles fall faster
        rot: rand() * 360,
        vrot: (rand() - 0.5) * 40,
        depth,
        srcIndex: i % ingredients.length,
      }
    })

    const step = (ts: number) => {
      if (!runningRef.current) return
      const dt = lastTs.current ? Math.min((ts - lastTs.current) / 1000, 0.05) : 0
      lastTs.current = ts
      const h = heightRef.current
      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i]
        p.y += p.vy * dt
        p.rot += p.vrot * dt
        if (p.y > h + 80) {
          // Respawn at the top with fresh randomised motion.
          p.y = -60 - rand() * 80
          p.x = 8 + rand() * 84
          p.depth = 0.35 + rand() * 0.65
          p.vy = 26 + p.depth * 42
          p.vrot = (rand() - 0.5) * 40
          p.srcIndex = (p.srcIndex + 1) % ingredients.length
        }
        const el = els.current[i]
        if (el) {
          const scale = 0.5 + p.depth * 0.7
          const px = parallax.current.x * (0.4 + p.depth)
          const py = parallax.current.y * (0.4 + p.depth)
          el.style.transform = `translate3d(${px}px, ${p.y + py}px, 0) rotate(${p.rot}deg) scale(${scale})`
          el.style.opacity = String(0.18 + p.depth * 0.4)
          el.style.filter = p.depth < 0.6 ? "blur(1.5px)" : "none"
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    const start = () => {
      if (runningRef.current) return
      runningRef.current = true
      lastTs.current = 0
      rafRef.current = requestAnimationFrame(step)
    }
    const stop = () => {
      runningRef.current = false
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    // Pause when scrolled out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && document.visibilityState === "visible") start()
        else stop()
      },
      { threshold: 0.05 },
    )
    io.observe(root)

    // Pause when the tab is hidden.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop()
      else if (isInViewport(root)) start()
    }
    document.addEventListener("visibilitychange", onVisibility)

    // Recompute height on resize (cheap, event-driven, not per-frame).
    const ro = new ResizeObserver(measure)
    ro.observe(root)

    // Subtle pointer parallax on precise pointers only. Displacement stays a few px.
    const fine = window.matchMedia("(pointer: fine)").matches
    const onPointer = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      parallax.current.x = ((e.clientX - r.left) / r.width - 0.5) * 10
      parallax.current.y = ((e.clientY - r.top) / r.height - 0.5) * 6
    }
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true })

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      if (fine) window.removeEventListener("pointermove", onPointer)
    }
  }, [count, ingredients])

  if (ingredients.length === 0) return null

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-hero-scene
    >
      {Array.from({ length: count }).map((_, i) => {
        const asset = ingredients[i % ingredients.length]
        return (
          <img
            key={i}
            ref={(el) => {
              els.current[i] = el
            }}
            src={asset.artDesktop}
            alt=""
            width={40}
            height={40}
            style={{ left: `${8 + ((i * 11) % 84)}%`, willChange: "transform, opacity" }}
            className="absolute top-0 h-9 w-9 sm:h-11 sm:w-11"
          />
        )
      })}
    </div>
  )
}

function isInViewport(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < window.innerHeight
}

/** Tiny deterministic PRNG so the scene looks identical run-to-run (no hydration flicker of layout). */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

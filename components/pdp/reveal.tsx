"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduced
}

/**
 * IntersectionObserver-driven "reveal once". CRITICAL a11y rule: when reduced motion is preferred
 * (or IO is unavailable), the content starts in its FINAL visible state; there is never a
 * hidden-content trap.
 */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = React.useRef<T | null>(null)
  const reduced = usePrefersReducedMotion()
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    if (reduced) {
      setInView(true)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            obs.disconnect()
          }
        }
      },
      { threshold: 0.15, ...options },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reduced, options])

  return { ref, inView, reduced }
}

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** ms delay for a light stagger. */
  delay?: number
  as?: "div" | "li"
}

/** Gentle fade + rise on first view. Instant under reduced motion. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const { ref, inView, reduced } = useInView<HTMLDivElement>()
  const Comp = as as React.ElementType
  return (
    <Comp
      ref={ref}
      style={reduced ? undefined : { transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-500 ease-out motion-reduce:transition-none",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      )}
    >
      {children}
    </Comp>
  )
}

export { usePrefersReducedMotion }

"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import type { HeroIngredientAsset, HeroMotionProfile } from "@/lib/hero/types"

// Code-split the animation so it never blocks first paint of the server-rendered hero copy + product.
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
})

/**
 * Decides whether to load the decorative scene at all. Under prefers-reduced-motion the scene is
 * never loaded (the static server composition is complete on its own). This is a client boundary so
 * the surrounding hero copy and product image stay fully server-rendered.
 */
export function HeroSceneMount({
  ingredients,
  motion,
}: {
  ingredients: HeroIngredientAsset[]
  motion: HeroMotionProfile
}) {
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setEnabled(!query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  if (!enabled || ingredients.length === 0) return null
  return <HeroScene ingredients={ingredients} motion={motion} />
}

"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type CSSProperties } from "react"

import type { ApprovedFusionHeroFragrance } from "@/lib/hero/fusion-config"
import { PermanentDropScene } from "./permanent-drop-scene"

const BRAND_LETTERS = ["F", "Á", "D", "É"] as const

function fragranceName(fragrance: ApprovedFusionHeroFragrance) {
  return fragrance.externalReference
    ? `${fragrance.externalReference.brand} ${fragrance.externalReference.name}`
    : "the approved fusion fragrance"
}

export function FusionHeroSequence({
  fragrance,
}: {
  fragrance: ApprovedFusionHeroFragrance
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let inView = false

    const syncPlayback = () => {
      setPaused(
        reducedMotion.matches ||
          document.visibilityState === "hidden" ||
          !inView,
      )
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        syncPlayback()
      },
      { threshold: 0.12 },
    )

    const onVisibility = () => syncPlayback()
    const onMotionPreference = () => syncPlayback()

    observer.observe(root)
    document.addEventListener("visibilitychange", onVisibility)
    reducedMotion.addEventListener("change", onMotionPreference)

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      reducedMotion.removeEventListener("change", onMotionPreference)
    }
  }, [])

  const name = fragranceName(fragrance)

  return (
    <div
      ref={rootRef}
      className="fusion-hero-sequence relative mx-auto h-[430px] w-full max-w-[610px] sm:h-[520px]"
      data-fusion-hero
      data-fusion-state={paused ? "paused" : completed ? "complete" : "running"}
      role="img"
      aria-label={`${name}, closest to the combined scent profile of bright fruit and dark woods, in a cinematic sequence that forms FÁDÉ`}
    >
      <PermanentDropScene
        priority={false}
        className="fusion-source-scene"
        decorative
      />

      <div className="fusion-stage" aria-hidden>
        <div className="fusion-ambient" />
        <div className="fusion-ground" />
        <div className="fusion-impact-ring fusion-impact-ring-one" />
        <div className="fusion-impact-ring fusion-impact-ring-two" />

        <div className="fusion-brand" data-fusion-brand="FÁDÉ">
          {BRAND_LETTERS.map((letter, index) => (
            <span
              key={letter}
              data-fusion-letter={letter}
              style={{ "--fusion-index": index } as CSSProperties}
              onAnimationEnd={index === BRAND_LETTERS.length - 1 ? () => setCompleted(true) : undefined}
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="fusion-mist" aria-hidden>
          {BRAND_LETTERS.map((letter, index) => (
            <svg
              key={letter}
              className="fusion-mist-path"
              data-fusion-spray={index + 1}
              style={{ "--fusion-index": index } as CSSProperties}
              viewBox="0 0 180 54"
              preserveAspectRatio="none"
            >
              <path d="M176 30 C142 8 115 45 83 25 C56 8 37 39 4 22" />
              <path className="fusion-mist-thread" d="M176 35 C146 22 119 50 91 35 C61 18 34 46 9 31" />
            </svg>
          ))}
        </div>

        <div className="fusion-bottle" data-fusion-bottle>
          <div className="fusion-bottle-body">
            <Image
              src={fragrance.approvedBottleAssetId}
              alt=""
              width={360}
              height={520}
              priority
              sizes="(max-width: 640px) 49vw, 310px"
              className="h-full w-full object-contain drop-shadow-[0_30px_34px_rgba(0,0,0,0.54)]"
            />
          </div>

          <div className="fusion-atomizer">
            <span className="fusion-atomizer-nozzle" />
            {BRAND_LETTERS.map((letter, index) => (
              <span
                key={letter}
                className="fusion-atomizer-press"
                data-fusion-atomizer-press={index + 1}
                style={{ "--fusion-index": index } as CSSProperties}
              />
            ))}
          </div>

          <div
            className="fusion-bottle-cap"
            data-cap-motion={fragrance.capMotion.toLowerCase()}
          >
            <Image
              src={fragrance.approvedCapAssetId}
              alt=""
              width={220}
              height={160}
              priority
              sizes="(max-width: 640px) 22vw, 145px"
              className="h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.44)]"
            />
          </div>
        </div>

        <p className="fusion-profile-label">
          Closest to the combined scent profile
        </p>
      </div>
    </div>
  )
}

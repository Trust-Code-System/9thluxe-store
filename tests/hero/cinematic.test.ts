import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CinematicHeroScene } from "@/components/home/hero/permanent/cinematic-hero-scene"

describe("CinematicHeroScene", () => {
  it("contains four controlled spray beats and the correctly accented brand", () => {
    const markup = renderToStaticMarkup(createElement(CinematicHeroScene))

    expect(markup.match(/data-spray-burst=/g)).toHaveLength(4)
    expect(markup).toContain('data-cinematic-brand="FÁDÉ"')
    expect(markup).toContain("tom-ford-oud-wood-bottle.webp")
  })
})

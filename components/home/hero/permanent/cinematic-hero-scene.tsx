import Image from "next/image"

const BRAND_LETTERS = ["F", "Á", "D", "É"] as const

export function CinematicHeroScene() {
  return (
    <div
      className="cinematic-hero-scene"
      data-cinematic-hero
      aria-hidden="true"
    >
      <div className="cinematic-ambient" />
      <div className="cinematic-ground" />
      <div className="cinematic-impact-ring cinematic-impact-ring-one" />
      <div className="cinematic-impact-ring cinematic-impact-ring-two" />

      <div className="cinematic-brand" data-cinematic-brand="FÁDÉ">
        {BRAND_LETTERS.map((letter, index) => (
          <span key={letter} style={{ "--letter-index": index } as React.CSSProperties}>
            {letter}
          </span>
        ))}
      </div>

      <div className="cinematic-sprays">
        {BRAND_LETTERS.map((letter, index) => (
          <span
            key={letter}
            className="cinematic-spray-burst"
            data-spray-burst={index + 1}
            style={{ "--spray-index": index } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="cinematic-bottle" data-cinematic-bottle>
        <div className="cinematic-bottle-body">
          <Image
            src="/hero/tom-ford-oud-wood-bottle.webp"
            alt=""
            width={300}
            height={430}
            priority
            unoptimized
            sizes="(max-width: 640px) 47vw, 300px"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="cinematic-atomizer">
          <span />
        </div>
        <div className="cinematic-bottle-cap">
          <Image
            src="/hero/tom-ford-oud-wood-bottle.webp"
            alt=""
            width={300}
            height={430}
            priority
            unoptimized
            sizes="(max-width: 640px) 47vw, 300px"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <p className="cinematic-kicker">An arrival in four notes</p>
    </div>
  )
}

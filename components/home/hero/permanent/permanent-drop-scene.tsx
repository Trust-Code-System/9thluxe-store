import Image from "next/image"
import { cn } from "@/lib/utils"

const AVENTUS_INGREDIENTS = [
  ["/hero/drop/pineapple.png", "drop-pineapple"],
  ["/hero/drop/green-apple.png", "drop-apple"],
  ["/hero/drop/blackcurrant.png", "drop-blackcurrant"],
] as const

const OUD_WOOD_INGREDIENTS = [
  ["/hero/drop/sandalwood.png", "drop-sandalwood"],
  ["/hero/drop/cardamom.png", "drop-cardamom"],
  ["/hero/drop/vanilla-tonka.png", "drop-vanilla"],
] as const

type Ingredient = (typeof AVENTUS_INGREDIENTS | typeof OUD_WOOD_INGREDIENTS)[number]

function IngredientGroup({ ingredients }: { ingredients: readonly Ingredient[] }) {
  return (
    <div className="drop-ingredient-zone" aria-hidden>
      {ingredients.map(([src, className]) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={210}
          height={210}
          sizes="(max-width: 640px) 18vw, 112px"
          className={`drop-ingredient ${className}`}
        />
      ))}
    </div>
  )
}

type PermanentDropSceneProps = {
  priority?: boolean
  className?: string
  decorative?: boolean
}

export function PermanentDropScene({
  priority = true,
  className,
  decorative = false,
}: PermanentDropSceneProps) {
  return (
    <div
      className={cn(
        "permanent-drop-scene relative mx-auto h-[430px] w-full max-w-[610px] sm:h-[520px]",
        className,
      )}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : "Creed Aventus with pineapple, apple and blackcurrant, beside Tom Ford Oud Wood with sandalwood, cardamom and tonka bean"
      }
    >
      <div className="drop-ambient" aria-hidden />

      <div className="drop-perfume-zone drop-perfume-zone-left" data-perfume-zone="aventus">
        <div className="drop-pedestal" aria-hidden />
        <div className="drop-impact" aria-hidden />
        <div className="drop-bottle drop-bottle-aventus">
          <Image
            src="/hero/creed-aventus-bottle.webp"
            alt="Creed Aventus perfume bottle"
            width={320}
            height={430}
            priority={priority}
            sizes="(max-width: 640px) 42vw, 270px"
            className="h-full w-full object-contain drop-shadow-[0_28px_28px_rgba(0,0,0,0.5)]"
          />
        </div>
        <IngredientGroup ingredients={AVENTUS_INGREDIENTS} />
        <div className="drop-caption">
          <p>Creed · Aventus</p>
          <span>Pineapple · apple · blackcurrant</span>
        </div>
      </div>

      <div className="drop-perfume-zone drop-perfume-zone-right" data-perfume-zone="oud-wood">
        <div className="drop-pedestal" aria-hidden />
        <div className="drop-impact" aria-hidden />
        <div className="drop-bottle drop-bottle-oud">
          <Image
            src="/hero/tom-ford-oud-wood-bottle.webp"
            alt="Tom Ford Oud Wood perfume bottle"
            width={300}
            height={430}
            priority={priority}
            sizes="(max-width: 640px) 38vw, 245px"
            className="h-full w-full object-contain drop-shadow-[0_28px_28px_rgba(0,0,0,0.58)]"
          />
        </div>
        <IngredientGroup ingredients={OUD_WOOD_INGREDIENTS} />
        <div className="drop-caption">
          <p>Tom Ford · Oud Wood</p>
          <span>Cardamom · sandalwood · tonka</span>
        </div>
      </div>
    </div>
  )
}

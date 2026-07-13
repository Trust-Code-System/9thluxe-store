import Image from "next/image"

const INGREDIENTS = [
  ["/hero/drop/pineapple.png", "drop-pineapple"],
  ["/hero/drop/green-apple.png", "drop-apple"],
  ["/hero/drop/blackcurrant.png", "drop-blackcurrant"],
  ["/hero/drop/sandalwood.png", "drop-sandalwood"],
  ["/hero/drop/cardamom.png", "drop-cardamom"],
  ["/hero/drop/vanilla-tonka.png", "drop-vanilla"],
] as const

export function PermanentDropScene() {
  return (
    <div className="permanent-drop-scene relative mx-auto h-[430px] w-full max-w-[610px] sm:h-[520px]" role="img" aria-label="Creed Aventus with pineapple, apple and blackcurrant, beside Tom Ford Oud Wood with sandalwood, cardamom and tonka bean">
      <div className="drop-ambient" aria-hidden />
      <div className="drop-pedestal drop-pedestal-left" aria-hidden />
      <div className="drop-pedestal drop-pedestal-right" aria-hidden />
      <div className="drop-impact drop-impact-left" aria-hidden />
      <div className="drop-impact drop-impact-right" aria-hidden />
      <div className="drop-bottle drop-bottle-aventus">
        <Image src="/hero/creed-aventus-bottle.webp" alt="Creed Aventus perfume bottle" width={320} height={430} priority sizes="(max-width: 640px) 42vw, 270px" className="h-full w-full object-contain drop-shadow-[0_28px_28px_rgba(0,0,0,0.5)]" />
      </div>
      <div className="drop-bottle drop-bottle-oud">
        <Image src="/hero/tom-ford-oud-wood-bottle.webp" alt="Tom Ford Oud Wood perfume bottle" width={300} height={430} priority sizes="(max-width: 640px) 38vw, 245px" className="h-full w-full object-contain drop-shadow-[0_28px_28px_rgba(0,0,0,0.58)]" />
      </div>
      {INGREDIENTS.map(([src, className]) => <Image key={src} src={src} alt="" width={210} height={210} sizes="(max-width: 640px) 22vw, 130px" className={`drop-ingredient ${className}`} />)}
      <div className="drop-caption drop-caption-left"><p>Creed · Aventus</p><span>Pineapple · apple · blackcurrant</span></div>
      <div className="drop-caption drop-caption-right"><p>Tom Ford · Oud Wood</p><span>Cardamom · sandalwood · tonka</span></div>
    </div>
  )
}

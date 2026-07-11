import type { HeroFeaturedProduct } from "@/lib/hero/types";

/**
 * The static hero composition: a real merchant-owned product image resting on a dark wet-stone
 * pedestal over a shallow reflective water surface. Fully server-rendered so it is the LCP element,
 * the poster fallback (reduced motion, low power, failed scene load) and the always-present base the
 * decorative animation layers on top of. Dimensions are reserved to prevent layout shift.
 */
export function HeroStage({ product }: { product: HeroFeaturedProduct }) {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px]">
      {/* Ambient pedestal light */}
      <div aria-hidden className="pedestal-light absolute -inset-10" />

      {/* Shallow reflective water surface */}
      <div
        aria-hidden
        className="hero-water absolute inset-x-0 bottom-0 h-[38%] rounded-[50%/22%]"
      >
        <div className="hero-water-ring absolute inset-x-[18%] top-[26%] h-[40%] rounded-[50%]" />
        <div className="hero-water-ring absolute inset-x-[30%] top-[38%] h-[24%] rounded-[50%] opacity-70" />
      </div>

      {/* Wet-stone pedestal */}
      <div
        aria-hidden
        className="hero-pedestal absolute bottom-[16%] left-1/2 h-[12%] w-[62%] -translate-x-1/2 rounded-[50%]"
      />

      {/* Contact shadow under the bottle */}
      <div
        aria-hidden
        className="hero-contact-shadow absolute bottom-[20%] left-1/2 h-[5%] w-[42%] -translate-x-1/2 rounded-[100%] blur-md"
      />

      {/* Product bottle (real merchant image) */}
      <div className="absolute inset-x-0 bottom-[22%] top-0 flex items-end justify-center">
        <div className="relative">
          <img
            src={product.image}
            alt={product.alt}
            width={300}
            height={420}
            fetchPriority="high"
            decoding="async"
            className="h-[clamp(240px,42vh,420px)] w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
          />
          {/* Narrow highlight travelling across the glass */}
          <span
            aria-hidden
            className="hero-glass-sweep pointer-events-none absolute inset-y-2 left-0 w-1/3 bg-gradient-to-r from-transparent via-[color:var(--almond)]/25 to-transparent"
          />
        </div>
      </div>

      {/* Soft reflection of the bottle on the water */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex justify-center opacity-[0.12] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      >
        <img
          src={product.image}
          alt=""
          width={300}
          height={420}
          className="h-[clamp(70px,12vh,120px)] w-auto -scale-y-100 object-contain"
        />
      </div>
    </div>
  );
}

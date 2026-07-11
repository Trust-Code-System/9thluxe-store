/**
 * Neutral hero stage shown when no product has been approved for the homepage. It keeps the cinematic
 * wet-stone pedestal and water so the section still feels premium, but shows NO fictional bottle and
 * NO invented perfume information. A soft light stands where a featured fragrance would rest.
 */
export function HeroPlaceholderStage() {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[420px]"
      role="img"
      aria-label="Curated fragrance presentation, awaiting the next featured perfume"
    >
      <div aria-hidden className="pedestal-light absolute -inset-10" />

      <div
        aria-hidden
        className="hero-water absolute inset-x-0 bottom-0 h-[38%] rounded-[50%/22%]"
      >
        <div className="hero-water-ring absolute inset-x-[18%] top-[26%] h-[40%] rounded-[50%]" />
        <div className="hero-water-ring absolute inset-x-[30%] top-[38%] h-[24%] rounded-[50%] opacity-70" />
      </div>

      <div
        aria-hidden
        className="hero-pedestal absolute bottom-[16%] left-1/2 h-[12%] w-[62%] -translate-x-1/2 rounded-[50%]"
      />

      {/* Soft column of light where the featured bottle would stand */}
      <div
        aria-hidden
        className="absolute bottom-[26%] left-1/2 h-[46%] w-[26%] -translate-x-1/2 rounded-[46%] bg-gradient-to-t from-[color:var(--almond)]/0 via-[color:var(--almond)]/10 to-transparent blur-xl"
      />
    </div>
  )
}

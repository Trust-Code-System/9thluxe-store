import Link from "next/link"

const FAMILIES = [
  {
    key: "CITRUS",
    name: "Citrus",
    mood: "Fresh & energising",
    description: "Bergamot, lemon, mandarin",
  },
  {
    key: "WOODY",
    name: "Woody",
    mood: "Warm & grounded",
    description: "Sandalwood, cedar, vetiver",
  },
  {
    key: "FLORAL",
    name: "Floral",
    mood: "Soft & romantic",
    description: "Rose, jasmine, tuberose",
  },
  {
    key: "ORIENTAL",
    name: "Oriental",
    mood: "Exotic & sensual",
    description: "Amber, oud, spice, incense",
  },
  {
    key: "FRESH",
    name: "Fresh",
    mood: "Clean & airy",
    description: "Oceanic, aquatic, green",
  },
  {
    key: "SPICY",
    name: "Spicy",
    mood: "Bold & confident",
    description: "Pepper, cardamom, cinnamon",
  },
]

export function FragranceFamilies() {
  return (
    <section className="paper-texture bg-secondary/40 py-16 lg:py-24">
      <div className="container mx-auto max-w-[1200px] space-y-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <span className="eyebrow">Explore by character</span>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Shop by Fragrance Family
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Every scent belongs to a family. Find the character that feels like you.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {FAMILIES.map((family) => (
            <Link
              key={family.key}
              href={`/shop?family=${family.key}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_40px_-26px_rgba(33,24,19,0.5)]"
            >
              <div className="space-y-1.5">
                <p className="font-serif text-xl font-medium text-foreground">{family.name}</p>
                <p className="text-sm font-medium text-accent">{family.mood}</p>
                <p className="mt-1 text-xs text-muted-foreground">{family.description}</p>
              </div>
              <span
                className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-accent"
                aria-hidden
              >
                Explore →
              </span>
              {/* Warm amber wash on hover */}
              <span className="amber-glow pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

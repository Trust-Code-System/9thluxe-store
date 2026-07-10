import Link from "next/link"
import { ArrowRight, Sparkles, FlaskConical, Compass } from "lucide-react"

const ENTRIES = [
  {
    title: "Find Your Scent",
    description: "Answer a few questions and let us compose a shortlist made for you.",
    href: "/find-your-fragrance",
    icon: Compass,
    cta: "Start the guide",
  },
  {
    title: "Discovery Sets",
    description: "Sample before you commit. Try a curated flight of fragrances at home.",
    href: "/discovery",
    icon: FlaskConical,
    cta: "Explore samples",
  },
  {
    title: "The Full Collection",
    description: "Browse every perfume in the house, filtered by note, family and mood.",
    href: "/shop",
    icon: Sparkles,
    cta: "Shop perfumes",
  },
]

export function CategoriesSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-3 text-center">
          <span className="eyebrow">Where to begin</span>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Three ways to discover
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            However you like to shop for fragrance, there is a door in for you.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          {ENTRIES.map(({ title, description, href, icon: Icon, cta }) => (
            <Link
              key={title}
              href={href}
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_45px_-28px_rgba(33,24,19,0.5)]"
            >
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-accent/12 text-accent">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="font-serif text-xl font-medium text-foreground">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                {cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

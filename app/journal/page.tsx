import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { getPublishedStoryCards } from "@/lib/stories/queries"
import { MainLayout } from "@/components/layout/main-layout"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "The Journal | Fádé",
  description:
    "Fragrance guides, editorial content, and olfactory education for the discerning nose.",
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default async function JournalPage() {
  const cards = await getPublishedStoryCards()
  const [featured, ...rest] = cards

  if (!featured) {
    return (
      <MainLayout>
        <section
          data-surface="night"
          className="grain relative bg-background py-16 text-foreground lg:py-24"
        >
          <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <header className="mb-8">
              <span className="eyebrow">The Journal</span>
              <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
                Notes &amp; <em className="text-accent">stories</em>
              </h1>
            </header>
            <p className="max-w-md leading-relaxed text-muted-foreground">
              New stories are coming soon.
            </p>
          </div>
        </section>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <section
        data-surface="night"
        className="grain relative bg-background py-16 text-foreground lg:py-24"
      >
        <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-16">
            <span className="eyebrow">The Journal</span>
            <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
              Notes &amp; <em className="text-accent">stories</em>
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              Fragrance education, seasonal guides, and the stories behind
              great perfumes.
            </p>
          </header>

          {/* Featured article: typographic, no placeholder imagery */}
          <Link
            href={`/journal/${featured.slug}`}
            className="veil group relative block overflow-hidden border border-border bg-card p-8 transition-colors hover:border-accent/50 sm:p-12"
          >
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <span className="text-accent">{featured.category}</span>
                <span aria-hidden>·</span>
                <span>{featured.readTime}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(featured.date)}</span>
              </div>
              <h2 className="mt-6 max-w-2xl text-balance font-serif text-3xl font-light leading-[1.12] transition-colors group-hover:text-accent md:text-5xl">
                {featured.title}
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                {featured.excerpt}
              </p>
              <div className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                Read article
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Article ledger */}
          <div className="mt-16 border-t border-border">
            {rest.map((article, i) => (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-5 border-b border-border py-7 transition-colors hover:bg-secondary/40 sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-x-8"
              >
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                    {article.category}
                  </p>
                  <h3 className="mt-2 font-serif text-xl font-light leading-snug transition-all duration-300 group-hover:italic group-hover:text-accent md:text-2xl">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                </div>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                  {article.readTime}
                </span>
                <ArrowUpRight
                  className="h-5 w-5 self-center text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

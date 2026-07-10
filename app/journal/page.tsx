import { journalArticles } from "@/lib/journal-articles"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "The Journal | Fàdè",
  description: "Fragrance guides, editorial content, and olfactory education for the discerning nose.",
}

export default function JournalPage() {
  const [featured, ...rest] = journalArticles

  return (
    <MainLayout>
      <section className="py-16 lg:py-20">
        <div className="container mx-auto max-w-[1200px] space-y-16 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mx-auto max-w-2xl space-y-4 text-center">
            <span className="eyebrow">The Journal</span>
            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Notes &amp; Stories
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Fragrance education, seasonal guides, and the stories behind great perfumes.
            </p>
          </header>

          {/* Featured Article */}
          <Link
            href={`/journal/${featured.slug}`}
            className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent/40"
          >
            <div className="relative aspect-[16/6] overflow-hidden bg-secondary">
              <div className="h-full w-full bg-gradient-to-br from-accent/15 via-accent/5 to-secondary transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="space-y-3 p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{featured.category}</Badge>
                <span className="text-xs text-muted-foreground">{featured.readTime}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(featured.date).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold leading-tight transition-colors group-hover:text-accent sm:text-3xl">
                {featured.title}
              </h2>
              <p className="max-w-2xl leading-relaxed text-muted-foreground">{featured.excerpt}</p>
              <div className="flex items-center gap-2 pt-1 text-sm font-medium text-accent">
                Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Article Grid */}
          <div className="grid gap-8 sm:grid-cols-2">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/40"
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-secondary">
                  <div className="h-full w-full bg-gradient-to-br from-accent/10 via-accent/5 to-secondary transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="space-y-2 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <h3 className="font-serif text-lg font-medium leading-snug transition-colors line-clamp-2 group-hover:text-accent">
                    {article.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

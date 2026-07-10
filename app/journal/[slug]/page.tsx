import { journalArticles, articleContent } from "@/lib/journal-articles"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/ui/product-card"
import { mapPrismaProductToCard } from "@/lib/queries/products"
import type { Metadata } from "next"

export function generateStaticParams() {
  return journalArticles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = journalArticles.find((a) => a.slug === slug)
  if (!article) return {}
  return {
    title: `${article.title} | The Journal | Fádé`,
    description: article.excerpt,
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = journalArticles.find((a) => a.slug === slug)
  if (!article) notFound()

  const paragraphs = articleContent[slug] ?? []
  const others = journalArticles.filter((a) => a.slug !== slug).slice(0, 3)

  let relatedProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  if (article.relatedProductSlugs?.length) {
    try {
      relatedProducts = await prisma.product.findMany({
        where: { slug: { in: article.relatedProductSlugs }, deletedAt: null },
      })
    } catch {
      // silently degrade
    }
  }

  return (
    <article className="py-16">
      <div className="container mx-auto max-w-[800px] px-6 space-y-10">
        {/* Back link */}
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          The Journal
        </Link>

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary">{article.category}</Badge>
            <span className="text-xs text-muted-foreground">{article.readTime}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {new Date(article.date).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">{article.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
        </header>

        {/* Hero image placeholder */}
        <div className="aspect-[16/7] rounded-2xl overflow-hidden bg-muted">
          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-muted" />
        </div>

        {/* Body */}
        <div className="space-y-6">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-border pt-10 space-y-6">
            <h2 className="text-xl font-semibold">Shop What&apos;s Referenced</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={mapPrismaProductToCard(p)} />
              ))}
            </div>
          </div>
        )}

        {/* More Articles */}
        <div className="border-t border-border pt-10 space-y-6">
          <h2 className="text-xl font-semibold">More from the Journal</h2>
          <div className="space-y-4">
            {others.map((a) => (
              <Link
                key={a.slug}
                href={`/journal/${a.slug}`}
                className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/40 transition-colors"
              >
                <div className="h-16 w-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-br from-primary/10 to-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    {a.category} · {a.readTime}
                  </p>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {a.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

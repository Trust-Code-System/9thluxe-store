import { journalArticles, articleContent } from "@/lib/journal-articles"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { MainLayout } from "@/components/layout/main-layout"
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
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
    <MainLayout>
      <article
        data-surface="night"
        className="grain relative bg-background py-14 text-foreground lg:py-20"
      >
        <div className="container relative z-10 mx-auto max-w-[760px] px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            The Journal
          </Link>

          {/* Header */}
          <header className="mt-10">
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="text-accent">{article.category}</span>
              <span aria-hidden>·</span>
              <span>{article.readTime}</span>
              <span aria-hidden>·</span>
              <span>
                {new Date(article.date).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="mt-6 text-balance font-serif text-4xl font-light leading-[1.08] tracking-[-0.01em] md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-6 font-serif text-lg italic leading-relaxed text-muted-foreground md:text-xl">
              {article.excerpt}
            </p>
          </header>

          <div className="rule-fade my-10" aria-hidden />

          {/* Body */}
          <div className="space-y-7">
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className="text-base leading-[1.85] text-foreground/85 first:first-letter:float-left first:first-letter:mr-3 first:first-letter:font-serif first:first-letter:text-6xl first:first-letter:leading-[0.85] first:first-letter:text-accent"
              >
                {para}
              </p>
            ))}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 border-t border-border pt-12">
              <p className="eyebrow mb-8">Referenced in this story</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={mapPrismaProductToCard(p)} />
                ))}
              </div>
            </div>
          )}

          {/* More Articles */}
          <div className="mt-16 border-t border-border pt-12">
            <p className="eyebrow mb-6">More from the Journal</p>
            <div className="border-t border-border">
              {others.map((a) => (
                <Link
                  key={a.slug}
                  href={`/journal/${a.slug}`}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-border py-5 transition-colors hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {a.category} · {a.readTime}
                    </p>
                    <p className="mt-1.5 line-clamp-2 font-serif text-lg font-light leading-snug transition-colors group-hover:text-accent">
                      {a.title}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 self-center text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </MainLayout>
  )
}

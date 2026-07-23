import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"

import { prisma } from "@/lib/prisma"
import {
  getPublicStory,
  getPublishedStoryCards,
  getAllStorySlugs,
} from "@/lib/stories/queries"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductCard } from "@/components/ui/product-card"
import { mapPrismaProductToCard } from "@/lib/queries/products"
import { StoryBlocks } from "@/components/journal/story-blocks"

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const slugs = await getAllStorySlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const story = await getPublicStory(slug)
  if (!story) return {}
  return {
    title: `${story.seoTitle ?? story.title} | The Journal | Fádé`,
    description: story.seoDescription ?? story.excerpt,
    openGraph: story.socialImageUrl
      ? { images: [{ url: story.socialImageUrl }] }
      : undefined,
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await getPublicStory(slug)
  if (!story) notFound()

  // Related products: prefer explicit relations, then any product blocks.
  const productSlugs = Array.from(
    new Set([
      ...story.relatedProductSlugs,
      ...story.blocks
        .filter((b) => b.type === "product")
        .map((b) => String((b.data as { productSlug?: string }).productSlug ?? ""))
        .filter(Boolean),
    ])
  )

  let relatedProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  if (productSlugs.length) {
    try {
      relatedProducts = await prisma.product.findMany({
        where: {
          slug: { in: productSlugs },
          deletedAt: null,
          publishStatus: "PUBLISHED",
        },
      })
    } catch {
      // silently degrade
    }
  }

  const others = (await getPublishedStoryCards())
    .filter((s) => s.slug !== slug)
    .slice(0, 3)

  return (
    <MainLayout>
      <article
        data-surface="night"
        className="grain relative bg-background py-14 text-foreground lg:py-20"
      >
        <div className="container relative z-10 mx-auto max-w-[760px] px-4 sm:px-6">
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            The Journal
          </Link>

          <header className="mt-10">
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="text-accent">{story.category}</span>
              {story.readTime && (
                <>
                  <span aria-hidden>·</span>
                  <span>{story.readTime}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>
                {new Date(story.date).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="mt-6 text-balance font-serif text-4xl font-light leading-[1.08] tracking-[-0.01em] md:text-5xl">
              {story.title}
            </h1>
            {(story.subtitle || story.excerpt) && (
              <p className="mt-6 font-serif text-lg italic leading-relaxed text-muted-foreground md:text-xl">
                {story.subtitle || story.excerpt}
              </p>
            )}
          </header>

          <div className="rule-fade my-10" aria-hidden />

          <StoryBlocks blocks={story.blocks} />

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

          {others.length > 0 && (
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
                        {a.category}
                        {a.readTime ? ` · ${a.readTime}` : ""}
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
          )}
        </div>
      </article>
    </MainLayout>
  )
}

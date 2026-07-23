import { MainLayout } from "@/components/layout/main-layout"
import { StoryBlocks } from "@/components/journal/story-blocks"

interface ManagedPageData {
  title: string
  eyebrow: string | null
  excerpt: string | null
  blocks: { type: string; data: unknown }[]
}

export function ManagedPage({ page }: { page: ManagedPageData }) {
  const blocks = page.blocks.map((block) => ({
    type: block.type,
    data: block.data && typeof block.data === "object" ? block.data as Record<string, unknown> : {},
  }))
  return (
    <MainLayout>
      <section data-surface="night" className="grain relative bg-background py-14 text-foreground lg:py-20">
        <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {page.eyebrow && <span className="eyebrow">{page.eyebrow}</span>}
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-5xl">{page.title}</h1>
          {page.excerpt && <p className="mb-12 mt-4 max-w-xl leading-relaxed text-muted-foreground">{page.excerpt}</p>}
          <div className={page.excerpt ? "" : "mt-12"}>
            <StoryBlocks blocks={blocks} />
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

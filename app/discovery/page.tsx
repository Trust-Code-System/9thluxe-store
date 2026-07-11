import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeader } from "@/components/ui/section-header"
import { ProductGrid } from "@/components/ui/product-grid"
import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"

export const metadata = {
  title: "Scent Discovery | Fádé",
  description: "Try before you commit: curated discovery sets and note-based picks.",
}

export const dynamic = "force-dynamic"

export default async function DiscoveryPage() {
  let sampleKits: ReturnType<typeof mapPrismaProductToCard>[] = []
  let curatedByNotes: ReturnType<typeof mapPrismaProductToCard>[] = []

  try {
    const [sampleKitProducts, byNotes] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, isFeatured: true },
        orderBy: [{ ratingAvg: "desc" }],
        take: 6,
      }),
      prisma.product.findMany({
        where: {
          deletedAt: null,
          OR: [
            { notesTop: { contains: "bergamot", mode: "insensitive" } },
            { notesHeart: { contains: "rose", mode: "insensitive" } },
            { notesBase: { contains: "sandalwood", mode: "insensitive" } },
          ],
        },
        orderBy: [{ ratingAvg: "desc" }],
        take: 6,
      }),
    ])
    sampleKits = sampleKitProducts.map(mapPrismaProductToCard)
    curatedByNotes = byNotes.map(mapPrismaProductToCard)
  } catch (err) {
    console.error("DiscoveryPage: failed to load products", err)
  }

  return (
    <MainLayout>
      {/* Night header */}
      <section data-surface="night" className="veil grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <span className="eyebrow">Try before you commit</span>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
            Discovery, by the <em className="text-accent">millilitre</em>.
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            Curated sets and note-based picks: the low-stakes way to meet a
            new signature.
          </p>
        </div>
      </section>

      {/* Day commerce sections */}
      <section data-surface="day" className="bg-background py-16 text-foreground lg:py-24">
        <div className="container mx-auto max-w-[1200px] space-y-20 px-4 sm:px-6 lg:px-8">
          <div>
            <SectionHeader
              eyebrow="The starting point"
              title="Featured discovery picks"
              viewAllHref="/shop"
            />
            {sampleKits.length > 0 ? (
              <ProductGrid products={sampleKits} columns={3} />
            ) : (
              <p className="border border-dashed border-border bg-card/60 p-10 text-center text-muted-foreground">
                Discovery sets are being curated. Check back soon.
              </p>
            )}
          </div>

          <div>
            <SectionHeader
              eyebrow="By note"
              title="Follow your favourite notes"
              subtitle="Bergamot openings, rose hearts, sandalwood dry-downs."
              viewAllHref="/shop?note=rose"
              viewAllLabel="Rose & more"
            />
            {curatedByNotes.length > 0 ? (
              <ProductGrid products={curatedByNotes} columns={3} />
            ) : (
              <p className="border border-dashed border-border bg-card/60 p-10 text-center text-muted-foreground">
                Use the{" "}
                <Link href="/find-your-fragrance" className="text-accent underline underline-offset-4">
                  fragrance finder
                </Link>{" "}
                to get personalised picks.
              </p>
            )}
          </div>

          <div className="flex justify-center border-t border-border pt-12">
            <Link
              href="/find-your-fragrance"
              className="inline-flex h-13 items-center justify-center bg-primary px-8 font-mono text-[12px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Find your fragrance
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

import Link from "next/link"
import { notFound } from "next/navigation"
import dynamic from "next/dynamic"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductJsonLd } from "@/components/seo/product-json-ld"
import { PdpStructuredData } from "@/components/seo/pdp-structured-data"
import { PdpSection } from "@/components/pdp/section"
import { PdpGallery } from "@/components/pdp/pdp-gallery"
import { PurchasePanel } from "@/components/pdp/purchase-panel"
import { StickyPurchaseBar } from "@/components/pdp/sticky-purchase-bar"
import { AtAGlance } from "@/components/pdp/at-a-glance"
import { ScentExplanation } from "@/components/pdp/scent-explanation"
import { FragrancePyramid } from "@/components/pdp/fragrance-pyramid"
import { MainAccords } from "@/components/pdp/main-accords"
import { AccordProminenceBars } from "@/components/pdp/accord-prominence"
import { ScentComposition } from "@/components/pdp/scent-composition"
import { ScentTimeline } from "@/components/pdp/scent-timeline"
import { WearTimeline } from "@/components/pdp/wear-timeline"
import { PerformanceProfile } from "@/components/pdp/performance-profile"
import { ClimateGuidance } from "@/components/pdp/climate-guidance"
import { Authenticity } from "@/components/pdp/authenticity"
import { DeliveryReturnsFaq } from "@/components/pdp/delivery-returns-faq"
import { BrandPerfumer } from "@/components/pdp/brand-perfumer"
import { DnaQuizPromo } from "@/components/pdp/dna-quiz-promo"
import { CompareDrawer } from "@/components/pdp/compare-drawer"
import { loadPdpData } from "@/lib/pdp/loader"
import { getPdpPolicy } from "@/lib/pdp/policy"

// Below-the-fold / interaction-only islands are code-split so the critical purchase path stays light.
const AiFitCheck = dynamic(() => import("@/components/pdp/ai-fit-check").then((m) => m.AiFitCheck), {
  loading: () => <SectionSkeleton />,
})
const LayeringLab = dynamic(() => import("@/components/pdp/layering-lab").then((m) => m.LayeringLab), {
  loading: () => <SectionSkeleton />,
})
const ReviewsSection = dynamic(() => import("@/components/pdp/reviews-section").then((m) => m.ReviewsSection), {
  loading: () => <SectionSkeleton />,
})
const QaSection = dynamic(() => import("@/components/pdp/qa-section").then((m) => m.QaSection), {
  loading: () => <SectionSkeleton />,
})
const Recommendations = dynamic(() => import("@/components/pdp/recommendations").then((m) => m.Recommendations), {
  loading: () => <SectionSkeleton />,
})

function SectionSkeleton() {
  return <div className="h-40 w-full animate-pulse rounded-xl bg-secondary/50" aria-hidden />
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const data = await loadPdpData(slug)
  if (!data) return { title: "Product Not Found | Fádé" }
  const firstImage = data.media.find((m) => m.kind === "image")?.url
  return {
    title: data.seo.title,
    description: data.seo.description,
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      images: firstImage ? [firstImage] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const data = await loadPdpData(slug)
  if (!data) notFound()

  const policy = getPdpPolicy()
  const images = data.media.filter((m) => m.kind === "image").map((m) => m.url)
  const availability = data.stock > 0 ? "InStock" : "OutOfStock"

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Perfumes", url: "/shop" },
    ...(data.brand ? [{ name: data.brand, url: `/shop?brand=${encodeURIComponent(data.brand)}` }] : []),
    { name: data.name, url: `/product/${data.slug}` },
  ]

  const composition = data.composition
  const bottleImage = images[0] ?? null
  const hasComposition = !!composition && composition.notes.length > 0
  const hasProfile = data.profileFacets.length > 0
  const hasPyramid = data.notesTop.length + data.notesHeart.length + data.notesBase.length > 0
  const hasScentStory =
    !!data.scentStory.summary ||
    !!data.scentStory.opening ||
    !!data.scentStory.heart ||
    !!data.scentStory.dryDown ||
    !!data.scentStory.mood
  const hasAccords = data.accords.length > 0
  const hasTimeline = data.timeline.length > 0
  const hasPerformance = data.performance.length > 0
  const hasClimate = hasPyramid || !!data.fragranceFamily || !!data.concentration

  return (
    <MainLayout>
      <ProductJsonLd
        name={data.name}
        description={data.description}
        image={images.length ? images : ["/placeholder-flacon.svg"]}
        price={data.basePriceNGN}
        currency={data.currency}
        brand={data.brand || undefined}
        availability={availability}
        rating={data.reviewSummary ? data.reviewSummary.ratingAvg : undefined}
        reviewCount={data.reviewSummary ? data.reviewSummary.ratingCount : undefined}
      />
      <PdpStructuredData crumbs={crumbs} faqs={policy.faqs} />

      <div className="container mx-auto px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          {crumbs.map((c, i) => (
            <span key={c.url} className="flex items-center gap-2.5">
              {i > 0 && (
                <span aria-hidden className="text-border">
                  /
                </span>
              )}
              {i < crumbs.length - 1 ? (
                <Link href={c.url} className="transition-colors hover:text-accent">
                  {c.name}
                </Link>
              ) : (
                <span className="truncate normal-case text-foreground/70">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Hero: gallery + purchase panel */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PdpGallery media={data.media} productName={data.name} productId={data.id} />
          </div>
          <div>
            <PurchasePanel
              data={data}
              policyShipping={policy.shippingSummary}
              policyReturns={policy.returnsSummary(data.returnEligible)}
            />
          </div>
        </div>
        {/* Sentinel marks the end of the hero for the mobile sticky bar. */}
        <div id="pdp-hero-sentinel" aria-hidden />

        {/* Editorial stack */}
        <PdpSection show={hasProfile} eyebrow="At a glance" title="Fragrance profile">
          <AtAGlance facets={data.profileFacets} />
        </PdpSection>

        <PdpSection show={hasScentStory} eyebrow="The impression" title="What it smells like">
          <ScentExplanation story={data.scentStory} />
        </PdpSection>

        <PdpSection
          show={hasComposition}
          eyebrow="Composition"
          title="The ingredients"
          description="Every note in this fragrance, arranged by when you meet it. Select any ingredient to explore its scent character and role."
        >
          {composition && (
            <ScentComposition
              composition={composition}
              bottleImage={bottleImage}
              productName={data.name}
              productId={data.id}
              template={composition.selectedTemplate ?? undefined}
            />
          )}
        </PdpSection>

        <PdpSection
          show={hasPyramid}
          eyebrow="At a glance"
          title="The fragrance pyramid"
          description="A scent unfolds in three acts. Select any note to explore other fragrances built around it."
        >
          <FragrancePyramid
            productId={data.id}
            notesTop={data.notesTop}
            notesHeart={data.notesHeart}
            notesBase={data.notesBase}
          />
        </PdpSection>

        <PdpSection show={hasAccords} eyebrow="Character" title="Main accords">
          {hasComposition && composition ? (
            <AccordProminenceBars accords={composition.accords} productId={data.id} />
          ) : (
            <MainAccords accords={data.accords} productId={data.id} />
          )}
        </PdpSection>

        <PdpSection
          show={hasTimeline}
          eyebrow="Over the day"
          title="How it wears"
          description="An editorial guide to how this fragrance is likely to evolve on skin."
        >
          {hasComposition && composition && composition.timeline.length > 0 ? (
            <ScentTimeline stages={composition.timeline} />
          ) : (
            <WearTimeline stages={data.timeline} />
          )}
        </PdpSection>

        <PdpSection
          show={hasPerformance}
          eyebrow="From wearers"
          title="Performance"
          description="Aggregated from verified customer reviews, not a laboratory measurement."
        >
          <PerformanceProfile metrics={data.performance} />
        </PdpSection>

        <PdpSection
          show={hasClimate}
          eyebrow="For your weather"
          title="Wearing it in Nigeria"
          description="Descriptive guidance for local conditions. Choose a setting. We never use your location automatically."
        >
          <ClimateGuidance
            family={data.fragranceFamily}
            concentration={data.concentration}
            sillage={data.reviewSummary?.sillage.score ? String(data.reviewSummary.sillage.score) : null}
            longevity={data.performance.find((m) => m.key === "longevity")?.score?.toString() ?? null}
          />
        </PdpSection>

        <PdpSection eyebrow="Personal fit" title="Will this suit me?">
          <AiFitCheck
            product={{
              id: data.id,
              name: data.name,
              notes: [...data.notesTop, ...data.notesHeart, ...data.notesBase].map((n) => n.name),
              family: data.fragranceFamily,
              priceNGN: data.basePriceNGN,
              occasion: data.recommendationSeed.occasion,
              climate: data.recommendationSeed.climate,
              hasSample: data.hasSample,
            }}
          />
        </PdpSection>

        {data.fragranceFamily && (
          <LayeringLab productId={data.id} productName={data.name} family={data.fragranceFamily} />
        )}

        <PdpSection id="reviews" eyebrow="Reviews" title="What wearers say">
          <ReviewsSection productId={data.id} summary={data.reviewSummary} />
        </PdpSection>

        <PdpSection eyebrow="Questions" title="Questions & answers">
          <QaSection productId={data.id} />
        </PdpSection>

        <PdpSection id="authenticity" eyebrow="Trust" title="Authenticity & sourcing">
          <Authenticity authenticity={data.authenticity} />
        </PdpSection>

        <PdpSection eyebrow="Before you buy" title="Delivery, returns & FAQs">
          <DeliveryReturnsFaq policy={policy} />
        </PdpSection>

        <PdpSection
          show={!!data.brandProfile || !!data.perfumer}
          eyebrow="The maker"
          title="Brand & perfumer"
        >
          <BrandPerfumer brand={data.brandProfile} perfumer={data.perfumer} />
        </PdpSection>

        <Recommendations seed={data.recommendationSeed} excludeId={data.id} />

        <PdpSection>
          <DnaQuizPromo />
        </PdpSection>
      </div>

      <StickyPurchaseBar data={data} />
      <CompareDrawer />
    </MainLayout>
  )
}

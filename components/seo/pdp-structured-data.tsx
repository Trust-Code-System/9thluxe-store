interface Crumb {
  name: string
  url: string
}

/**
 * Breadcrumb + FAQ structured data for the PDP. The FAQ block is emitted ONLY from the same policy
 * FAQ pairs that are visibly rendered on the page, never hidden or fabricated Q&A. Aggregate rating
 * / reviews live in <ProductJsonLd> and only appear when real.
 */
export function PdpStructuredData({
  crumbs,
  faqs,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000",
}: {
  crumbs: Crumb[]
  faqs: { q: string; a: string }[]
  baseUrl?: string
}) {
  const base = baseUrl.replace(/\/$/, "")
  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u.startsWith("/") ? u : `/${u}`}`)

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.url),
    })),
  }

  const faqPage =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {faqPage && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />}
    </>
  )
}

/**
 * Seed the current editorial/static routes into the Page CMS.
 * Idempotent and non-destructive: existing managed pages are never overwritten.
 * SAFETY: connects to DATABASE_URL. Run against development first and never production without approval.
 *
 *   npx tsx scripts/seed-pages.ts
 */
import { Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type SeedBlock = { type: string; data: Record<string, unknown> }
type SeedPage = { slug: string; title: string; eyebrow: string; excerpt: string; blocks: SeedBlock[] }

const paragraph = (text: string): SeedBlock => ({ type: "paragraph", data: { text } })
const heading = (text: string): SeedBlock => ({ type: "heading", data: { text, level: 2 } })
const button = (label: string, href: string): SeedBlock => ({ type: "button", data: { label, href } })

const pages: SeedPage[] = [
  {
    slug: "about", title: "A house built on taste, not volume", eyebrow: "Our story",
    excerpt: "Fádé is a Lagos house for rare and coveted perfumes, curated with care and described honestly.",
    blocks: [
      paragraph("Fádé began in Lagos with a simple discipline: stock only what we would wear ourselves. We are a considered edit of luxury perfumes, chosen bottle by bottle."),
      paragraph("Scent is the most intimate thing you wear. Choosing one deserves honest guidance, real notes, and a straight answer about how a fragrance behaves in our climate."),
      heading("How we work"),
      heading("Sourced deliberately"), paragraph("We buy from suppliers we trust and record the provenance of every fragrance."),
      heading("Inspected on arrival"), paragraph("Each item is checked and sealed before dispatch, with its provenance described honestly."),
      heading("Described truthfully"), paragraph("We share notes, sillage, longevity, and how a scent behaves in Nigerian heat."),
      heading("Delivered carefully"), paragraph("We deliver across all 36 states and the FCT, packed with care."),
      button("Explore the collections", "/collections"), button("Contact the concierge", "/help/contact"),
    ],
  },
  {
    slug: "faq", title: "Questions, answered", eyebrow: "Help",
    excerpt: "Common questions about ordering, delivery, payments, authenticity, and returns.",
    blocks: [
      heading("Do you deliver nationwide?"), paragraph("Yes. We deliver to all 36 states and the FCT."),
      heading("What payment methods are accepted?"), paragraph("We accept cards, bank transfers, and USSD securely through Paystack."),
      heading("Are all products authentic?"), paragraph("Every product is sourced from trusted distributors and inspected before dispatch."),
      heading("Can I return or exchange an item?"), paragraph("Eligible sealed and unused items can be returned within the published return window."),
      heading("How do I track my order?"), paragraph("Tracking information is emailed after dispatch and is also available in your account order history."),
      button("Contact us", "/help/contact"),
    ],
  },
  {
    slug: "help", title: "How can we help?", eyebrow: "Help center",
    excerpt: "Find answers or reach a person quickly, whichever you prefer.",
    blocks: [button("Frequently asked questions", "/help/faq"), button("Contact us", "/help/contact"), button("Shipping", "/help/shipping"), button("Returns and exchanges", "/help/returns")],
  },
  {
    slug: "help/faq", title: "Frequently Asked Questions", eyebrow: "Help center",
    excerpt: "Answers to common questions about shopping at Fádé.",
    blocks: [heading("How long does shipping take?"), paragraph("Standard delivery takes 3-5 business days and express delivery takes 1-2 business days."), heading("Do you ship internationally?"), paragraph("We currently ship within Nigeria."), heading("Are your products authentic?"), paragraph("Every bottle is inspected and sealed by Fádé before dispatch."), button("Contact support", "/help/contact")],
  },
  {
    slug: "help/shipping", title: "Shipping Information", eyebrow: "Help center",
    excerpt: "Fast and secure delivery options across Nigeria.",
    blocks: [heading("Standard delivery"), paragraph("Nationwide delivery typically takes 3-5 business days."), heading("Express delivery"), paragraph("Express delivery typically takes 1-2 business days in supported cities."), heading("Processing time"), paragraph("Orders are usually processed within 1-2 business days. Tracking details are sent after dispatch."), heading("Packaging"), paragraph("Every item is packed with protective padding to arrive safely."), button("Contact support", "/help/contact")],
  },
  {
    slug: "help/returns", title: "Returns and Exchanges", eyebrow: "Help center",
    excerpt: "Guidance for returning eligible sealed and unused items.",
    blocks: [heading("Return policy"), paragraph("Eligible items must be sealed, unused, in their original packaging, and requested within the published return window."), heading("How to request a return"), paragraph("Contact customer service with your order number and reason for return. We will provide the next steps."), heading("Refunds"), paragraph("Approved refunds are sent to the original payment method after the returned item is received and inspected."), button("Contact customer service", "/help/contact"), button("View my orders", "/account/orders")],
  },
]

async function main() {
  let created = 0
  for (const page of pages) {
    const exists = await prisma.page.findUnique({ where: { slug: page.slug }, select: { id: true } })
    if (exists) continue
    await prisma.page.create({
      data: {
        ...page, status: "PUBLISHED", publishedAt: new Date(), seoTitle: page.title,
        seoDescription: page.excerpt,
        blocks: { create: page.blocks.map((block, position) => ({ ...block, position, data: block.data as Prisma.InputJsonValue })) },
      },
    })
    created++
  }
  console.log(`Page seed complete: ${created} created, ${pages.length - created} preserved.`)
}

main().catch((error) => { console.error(error); process.exit(1) }).finally(() => prisma.$disconnect())

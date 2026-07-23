// lib/stories/queries.ts
// Public-facing reads for the Journal. Reads the DB first; if the Story tables are empty or
// unavailable (e.g. migration not yet applied in an environment), it degrades gracefully to the
// legacy static array so the storefront never breaks during rollout.

import { prisma } from "@/lib/prisma"
import { isStoryVisible } from "./util"
import { journalArticles, articleContent, type JournalArticle } from "@/lib/journal-articles"

export interface PublicStoryCard {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string // ISO
  coverImageUrl: string | null
  featured: boolean
}

export interface PublicStory extends PublicStoryCard {
  subtitle: string | null
  author: string | null
  seoTitle: string | null
  seoDescription: string | null
  socialImageUrl: string | null
  blocks: { type: string; data: Record<string, unknown> }[]
  relatedProductSlugs: string[]
}

function fallbackCards(): PublicStoryCard[] {
  return journalArticles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    readTime: a.readTime,
    date: a.date,
    coverImageUrl: a.heroImage ?? null,
    featured: false,
  }))
}

function fallbackStory(slug: string): PublicStory | null {
  const a = journalArticles.find((x) => x.slug === slug)
  if (!a) return null
  const paragraphs = articleContent[slug] ?? []
  return {
    slug: a.slug,
    title: a.title,
    subtitle: null,
    excerpt: a.excerpt,
    category: a.category,
    readTime: a.readTime,
    date: a.date,
    coverImageUrl: a.heroImage ?? null,
    featured: false,
    author: null,
    seoTitle: null,
    seoDescription: a.excerpt,
    socialImageUrl: null,
    blocks: paragraphs.map((text) => ({ type: "paragraph", data: { text } })),
    relatedProductSlugs: a.relatedProductSlugs ?? [],
  }
}

/** True when any managed story exists (published or not). Signals we've migrated off the static array. */
async function hasManagedStories(): Promise<boolean> {
  try {
    const count = await prisma.story.count({ where: { deletedAt: null } })
    return count > 0
  } catch {
    return false
  }
}

export async function getPublishedStoryCards(): Promise<PublicStoryCard[]> {
  try {
    if (!(await hasManagedStories())) return fallbackCards()
    const now = new Date()
    const rows = await prisma.story.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      },
      orderBy: [{ featured: "desc" }, { position: "asc" }, { publishedAt: "desc" }],
    })
    return rows
      .filter((r) =>
        isStoryVisible({
          status: r.status as "PUBLISHED",
          publishedAt: r.publishedAt,
          scheduledFor: r.scheduledFor,
          unpublishAt: r.unpublishAt,
          deletedAt: r.deletedAt,
        }, now)
      )
      .map((r) => ({
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt ?? "",
        category: r.category ?? "Journal",
        readTime: r.readTime ?? "",
        date: (r.publishedAt ?? r.createdAt).toISOString(),
        coverImageUrl: r.coverImageUrl,
        featured: r.featured,
      }))
  } catch {
    return fallbackCards()
  }
}

export async function getPublicStory(slug: string): Promise<PublicStory | null> {
  try {
    const now = new Date()
    const row = await prisma.story.findUnique({
      where: { slug },
      include: {
        blocks: { orderBy: { position: "asc" } },
        relatedProducts: {
          orderBy: { position: "asc" },
          include: { product: { select: { slug: true, deletedAt: true } } },
        },
      },
    })
    if (!row) return fallbackStory(slug)
    const visible = isStoryVisible(
      {
        status: row.status as "PUBLISHED",
        publishedAt: row.publishedAt,
        scheduledFor: row.scheduledFor,
        unpublishAt: row.unpublishAt,
        deletedAt: row.deletedAt,
      },
      now
    )
    if (!visible) return null
    return {
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      excerpt: row.excerpt ?? "",
      category: row.category ?? "Journal",
      readTime: row.readTime ?? "",
      date: (row.publishedAt ?? row.createdAt).toISOString(),
      coverImageUrl: row.coverImageUrl,
      featured: row.featured,
      author: row.author,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription ?? row.excerpt,
      socialImageUrl: row.socialImageUrl,
      blocks: row.blocks.map((b) => ({ type: b.type, data: (b.data ?? {}) as Record<string, unknown> })),
      relatedProductSlugs: row.relatedProducts
        .filter((rp) => rp.product && rp.product.deletedAt === null)
        .map((rp) => rp.product.slug),
    }
  } catch {
    return fallbackStory(slug)
  }
}

/** Slugs for generateStaticParams: union of managed + static so no published route 404s. */
export async function getAllStorySlugs(): Promise<string[]> {
  const staticSlugs = journalArticles.map((a) => a.slug)
  try {
    const rows = await prisma.story.findMany({
      where: { deletedAt: null },
      select: { slug: true },
    })
    return Array.from(new Set([...rows.map((r) => r.slug), ...staticSlugs]))
  } catch {
    return staticSlugs
  }
}

export type { JournalArticle }

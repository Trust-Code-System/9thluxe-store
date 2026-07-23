import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getStoryForAdmin, StoryServiceError } from "@/lib/stories/service"
import {
  StoryEditor,
  type StoryEditorInitial,
  type EditorBlock,
} from "@/components/admin/story-editor"

export const dynamic = "force-dynamic"

/** Format a Date to the value a <input type="datetime-local"> expects (local time). */
function toLocalInput(date: Date | null): string {
  if (!date) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let story
  try {
    story = await getStoryForAdmin(id)
  } catch (error) {
    if (error instanceof StoryServiceError && error.code === "NOT_FOUND") notFound()
    throw error
  }

  let products: { id: string; slug: string; name: string }[] = []
  try {
    products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    })
  } catch {
    products = []
  }

  const initial: StoryEditorInitial = {
    id: story.id,
    updatedAt: story.updatedAt.toISOString(),
    slug: story.slug,
    title: story.title,
    subtitle: story.subtitle ?? "",
    excerpt: story.excerpt ?? "",
    category: story.category ?? "",
    readTime: story.readTime ?? "",
    author: story.author ?? "",
    tags: story.tags ?? "",
    coverImageUrl: story.coverImageUrl ?? "",
    mobileCoverUrl: story.mobileCoverUrl ?? "",
    socialImageUrl: story.socialImageUrl ?? "",
    seoTitle: story.seoTitle ?? "",
    seoDescription: story.seoDescription ?? "",
    featured: story.featured,
    position: story.position,
    status: story.status as StoryEditorInitial["status"],
    scheduledFor: toLocalInput(story.scheduledFor),
    unpublishAt: toLocalInput(story.unpublishAt),
    blocks: story.blocks.map(
      (b): EditorBlock => ({ type: b.type as EditorBlock["type"], data: (b.data ?? {}) as Record<string, any> })
    ),
    relatedProductIds: story.relatedProducts.map((rp) => rp.productId),
  }

  return <StoryEditor mode="edit" initial={initial} products={products} />
}

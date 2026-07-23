// lib/stories/service.ts
// Admin CRUD + publishing for the Journal CMS. All mutations are audited. Callers MUST have
// already passed an admin authorization check (see API routes). Slug uniqueness, sanitisation,
// publish-window semantics, soft-delete, and optimistic concurrency live here.

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { slugify, sanitizeBlocks, canTransition } from "./util"
import type { StoryInput, StoryStatus } from "./types"
import { captureRevision } from "@/lib/revisions/service"

export class StoryServiceError extends Error {
  constructor(
    message: string,
    public code: "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "SLUG_TAKEN"
  ) {
    super(message)
    this.name = "StoryServiceError"
  }
}

async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || "story"
  let candidate = base
  let n = 2
  while (true) {
    const existing = await prisma.story.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${base}-${n++}`
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Resolve the publishedAt / status side effects of a requested status. */
function resolvePublishState(
  status: StoryStatus,
  scheduledFor: Date | null,
  currentPublishedAt: Date | null
): { status: StoryStatus; publishedAt: Date | null } {
  if (status === "PUBLISHED") {
    // If a future schedule is set, keep DRAFT until the scheduled time; publishedAt = schedule.
    if (scheduledFor && scheduledFor.getTime() > Date.now()) {
      return { status: "DRAFT", publishedAt: scheduledFor }
    }
    return { status: "PUBLISHED", publishedAt: currentPublishedAt ?? new Date() }
  }
  return { status, publishedAt: currentPublishedAt }
}

export interface ActorContext {
  actorId: string
  actorRole: string
}

export async function listStories(opts: { includeDeleted?: boolean } = {}) {
  return prisma.story.findMany({
    where: opts.includeDeleted ? {} : { deletedAt: null },
    orderBy: [{ deletedAt: "asc" }, { featured: "desc" }, { position: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { blocks: true, relatedProducts: true } } },
  })
}

export async function getStoryForAdmin(id: string) {
  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      blocks: { orderBy: { position: "asc" } },
      relatedProducts: {
        orderBy: { position: "asc" },
        include: { product: { select: { id: true, slug: true, name: true } } },
      },
    },
  })
  if (!story) throw new StoryServiceError("Story not found", "NOT_FOUND")
  return story
}

export async function createStory(input: StoryInput, actor: ActorContext) {
  if (!input.title || !input.title.trim()) {
    throw new StoryServiceError("Title is required", "VALIDATION")
  }
  const slug = await uniqueSlug(input.slug || input.title)
  const scheduledFor = parseDate(input.scheduledFor)
  const requestedStatus = (input.status ?? "DRAFT") as StoryStatus
  const { status, publishedAt } = resolvePublishState(requestedStatus, scheduledFor, null)
  const blocks = sanitizeBlocks(input.blocks)
  const relatedIds = Array.from(new Set(input.relatedProductIds ?? []))

  const story = await prisma.story.create({
    data: {
      slug,
      title: input.title.trim(),
      subtitle: input.subtitle ?? null,
      excerpt: input.excerpt ?? null,
      category: input.category ?? null,
      readTime: input.readTime ?? null,
      author: input.author ?? null,
      tags: input.tags ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      mobileCoverUrl: input.mobileCoverUrl ?? null,
      socialImageUrl: input.socialImageUrl ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      featured: Boolean(input.featured),
      position: Number.isFinite(input.position) ? Number(input.position) : 0,
      status,
      publishedAt,
      scheduledFor,
      unpublishAt: parseDate(input.unpublishAt),
      createdBy: actor.actorId,
      blocks: { create: blocks.map((b) => ({ type: b.type, position: b.position, data: b.data as Prisma.InputJsonValue })) },
      relatedProducts: {
        create: relatedIds.map((productId, i) => ({ productId, position: i })),
      },
    },
  })

  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: `story.create:${status}`,
    targetType: "Story",
    targetId: story.id,
    metadata: { slug: story.slug, title: story.title },
  })
  return story
}

export async function updateStory(
  id: string,
  input: StoryInput,
  actor: ActorContext,
  expectedUpdatedAt?: string
) {
  const current = await prisma.story.findUnique({ where: { id }, include: { blocks: { orderBy: { position: "asc" } }, relatedProducts: { orderBy: { position: "asc" } } } })
  if (!current) throw new StoryServiceError("Story not found", "NOT_FOUND")

  // Optimistic concurrency: reject if the record changed since the editor loaded it.
  if (expectedUpdatedAt && current.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new StoryServiceError(
      "This story was modified by someone else. Reload and try again.",
      "CONFLICT"
    )
  }

  const slug =
    input.slug && slugify(input.slug) !== current.slug
      ? await uniqueSlug(input.slug, id)
      : current.slug

  const scheduledFor =
    input.scheduledFor !== undefined ? parseDate(input.scheduledFor) : current.scheduledFor
  const requestedStatus = (input.status ?? (current.status as StoryStatus)) as StoryStatus
  if (!canTransition(current.status as StoryStatus, requestedStatus)) {
    throw new StoryServiceError(
      `Cannot change status from ${current.status} to ${requestedStatus}`,
      "VALIDATION"
    )
  }
  const { status, publishedAt } = resolvePublishState(
    requestedStatus,
    scheduledFor,
    current.publishedAt
  )

  const blocks = input.blocks !== undefined ? sanitizeBlocks(input.blocks) : undefined
  const relatedIds =
    input.relatedProductIds !== undefined
      ? Array.from(new Set(input.relatedProductIds))
      : undefined

  await captureRevision("Story", id, current, actor.actorId)

  const story = await prisma.$transaction(async (tx) => {
    if (blocks !== undefined) {
      await tx.storyBlock.deleteMany({ where: { storyId: id } })
    }
    if (relatedIds !== undefined) {
      await tx.storyProduct.deleteMany({ where: { storyId: id } })
    }
    return tx.story.update({
      where: { id },
      data: {
        slug,
        title: input.title?.trim() ?? current.title,
        subtitle: input.subtitle ?? current.subtitle,
        excerpt: input.excerpt ?? current.excerpt,
        category: input.category ?? current.category,
        readTime: input.readTime ?? current.readTime,
        author: input.author ?? current.author,
        tags: input.tags ?? current.tags,
        coverImageUrl: input.coverImageUrl ?? current.coverImageUrl,
        mobileCoverUrl: input.mobileCoverUrl ?? current.mobileCoverUrl,
        socialImageUrl: input.socialImageUrl ?? current.socialImageUrl,
        seoTitle: input.seoTitle ?? current.seoTitle,
        seoDescription: input.seoDescription ?? current.seoDescription,
        featured: input.featured ?? current.featured,
        position: input.position ?? current.position,
        status,
        publishedAt,
        scheduledFor,
        unpublishAt:
          input.unpublishAt !== undefined ? parseDate(input.unpublishAt) : current.unpublishAt,
        ...(blocks !== undefined
          ? { blocks: { create: blocks.map((b) => ({ type: b.type, position: b.position, data: b.data as Prisma.InputJsonValue })) } }
          : {}),
        ...(relatedIds !== undefined
          ? { relatedProducts: { create: relatedIds.map((productId, i) => ({ productId, position: i })) } }
          : {}),
      },
    })
  })

  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: `story.update:${status}`,
    targetType: "Story",
    targetId: story.id,
    metadata: { slug: story.slug, from: current.status, to: status },
  })
  return story
}

/** Soft-delete (trash). Recoverable. */
export async function archiveStory(id: string, actor: ActorContext, hard = false) {
  const current = await prisma.story.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!current) throw new StoryServiceError("Story not found", "NOT_FOUND")
  if (hard) {
    await prisma.story.delete({ where: { id } })
    await writeAudit({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "story.delete:permanent",
      targetType: "Story",
      targetId: id,
      metadata: { slug: current.slug },
    })
    return { id, deleted: true }
  }
  const story = await prisma.story.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  })
  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "story.trash",
    targetType: "Story",
    targetId: id,
    metadata: { slug: current.slug },
  })
  return story
}

export async function restoreStory(id: string, actor: ActorContext) {
  const current = await prisma.story.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!current) throw new StoryServiceError("Story not found", "NOT_FOUND")
  const story = await prisma.story.update({
    where: { id },
    data: { deletedAt: null, status: "DRAFT" },
  })
  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "story.restore",
    targetType: "Story",
    targetId: id,
    metadata: { slug: current.slug },
  })
  return story
}

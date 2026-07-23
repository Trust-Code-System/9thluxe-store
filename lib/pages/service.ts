import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { canTransition } from "@/lib/stories/util"
import { normalizePageSlug, sanitizePageBlocks, sanitizePageText } from "./util"
import type { PageInput, PageStatus } from "./types"
import { captureRevision } from "@/lib/revisions/service"

export class PageServiceError extends Error {
  constructor(message: string, public code: "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "SLUG_TAKEN") {
    super(message)
    this.name = "PageServiceError"
  }
}

export interface PageActor {
  actorId: string
  actorRole: string
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function publishState(status: PageStatus, scheduledFor: Date | null, publishedAt: Date | null) {
  if (status !== "PUBLISHED") return { status, publishedAt }
  if (scheduledFor && scheduledFor > new Date()) return { status: "DRAFT" as const, publishedAt: scheduledFor }
  return { status, publishedAt: publishedAt ?? new Date() }
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.page.findUnique({ where: { slug }, select: { id: true } })
  if (existing && existing.id !== excludeId) throw new PageServiceError("That route is already managed", "SLUG_TAKEN")
}

export function listPages(includeDeleted = false) {
  return prisma.page.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    include: { _count: { select: { blocks: true } } },
    orderBy: [{ deletedAt: "asc" }, { slug: "asc" }],
  })
}

export async function getPageForAdmin(id: string) {
  const page = await prisma.page.findUnique({
    where: { id },
    include: { blocks: { orderBy: { position: "asc" } } },
  })
  if (!page) throw new PageServiceError("Page not found", "NOT_FOUND")
  return page
}

export async function createPage(input: PageInput, actor: PageActor) {
  const title = sanitizePageText(input.title, 160)
  const slug = normalizePageSlug(input.slug || input.title || "")
  if (!title || !slug) throw new PageServiceError("Title and route are required", "VALIDATION")
  await assertSlugAvailable(slug)
  const scheduledFor = parseDate(input.scheduledFor)
  const state = publishState(input.status ?? "DRAFT", scheduledFor, null)
  const blocks = sanitizePageBlocks(input.blocks)
  const page = await prisma.page.create({
    data: {
      slug,
      title,
      eyebrow: sanitizePageText(input.eyebrow, 80),
      excerpt: sanitizePageText(input.excerpt, 500),
      seoTitle: sanitizePageText(input.seoTitle, 70),
      seoDescription: sanitizePageText(input.seoDescription, 180),
      status: state.status,
      publishedAt: state.publishedAt,
      scheduledFor,
      unpublishAt: parseDate(input.unpublishAt),
      createdBy: actor.actorId,
      blocks: { create: blocks.map((block) => ({ type: block.type, position: block.position, data: block.data as Prisma.InputJsonValue })) },
    },
  })
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: `page.create:${page.status}`, targetType: "Page", targetId: page.id, metadata: { slug } })
  return page
}

export async function updatePage(id: string, input: PageInput, actor: PageActor, expectedUpdatedAt?: string) {
  const current = await prisma.page.findUnique({ where: { id }, include: { blocks: { orderBy: { position: "asc" } } } })
  if (!current) throw new PageServiceError("Page not found", "NOT_FOUND")
  if (expectedUpdatedAt && current.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new PageServiceError("This page changed elsewhere. Reload before saving.", "CONFLICT")
  }
  const slug = normalizePageSlug(input.slug ?? current.slug)
  const title = sanitizePageText(input.title ?? current.title, 160)
  if (!slug || !title) throw new PageServiceError("Title and route are required", "VALIDATION")
  await assertSlugAvailable(slug, id)
  const requested = input.status ?? (current.status as PageStatus)
  if (!canTransition(current.status as PageStatus, requested)) throw new PageServiceError("Invalid status change", "VALIDATION")
  const scheduledFor = input.scheduledFor !== undefined ? parseDate(input.scheduledFor) : current.scheduledFor
  const state = publishState(requested, scheduledFor, current.publishedAt)
  const blocks = input.blocks === undefined ? undefined : sanitizePageBlocks(input.blocks)
  await captureRevision("Page", id, current, actor.actorId)
  const page = await prisma.$transaction(async (tx) => {
    if (blocks) await tx.pageBlock.deleteMany({ where: { pageId: id } })
    return tx.page.update({
      where: { id },
      data: {
        slug,
        title,
        eyebrow: input.eyebrow === undefined ? current.eyebrow : sanitizePageText(input.eyebrow, 80),
        excerpt: input.excerpt === undefined ? current.excerpt : sanitizePageText(input.excerpt, 500),
        seoTitle: input.seoTitle === undefined ? current.seoTitle : sanitizePageText(input.seoTitle, 70),
        seoDescription: input.seoDescription === undefined ? current.seoDescription : sanitizePageText(input.seoDescription, 180),
        status: state.status,
        publishedAt: state.publishedAt,
        scheduledFor,
        unpublishAt: input.unpublishAt === undefined ? current.unpublishAt : parseDate(input.unpublishAt),
        ...(blocks ? { blocks: { create: blocks.map((block) => ({ type: block.type, position: block.position, data: block.data as Prisma.InputJsonValue })) } } : {}),
      },
    })
  })
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: `page.update:${page.status}`, targetType: "Page", targetId: page.id, metadata: { slug, from: current.status, to: page.status } })
  return page
}

export async function trashPage(id: string, actor: PageActor) {
  const current = await prisma.page.findUnique({ where: { id }, select: { slug: true } })
  if (!current) throw new PageServiceError("Page not found", "NOT_FOUND")
  const page = await prisma.page.update({ where: { id }, data: { status: "ARCHIVED", deletedAt: new Date() } })
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: "page.trash", targetType: "Page", targetId: id, metadata: { slug: current.slug } })
  return page
}

export async function restorePage(id: string, actor: PageActor) {
  const page = await prisma.page.update({ where: { id }, data: { status: "DRAFT", deletedAt: null } })
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: "page.restore", targetType: "Page", targetId: id, metadata: { slug: page.slug } })
  return page
}

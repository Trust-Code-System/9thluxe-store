// lib/media/service.ts
// Media library: catalogue, upload recording, usage scanning, and safe deletion. All mutations are
// audited. Usage scanning powers "where is this used?" and prevents deleting a referenced asset.

import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { isValidHref } from "@/lib/navigation/defaults"

export interface UsageRef {
  type: string
  id: string
  label: string
}

export class MediaError extends Error {
  constructor(message: string, public code: "VALIDATION" | "NOT_FOUND" | "IN_USE" | "DUPLICATE" = "VALIDATION") {
    super(message)
    this.name = "MediaError"
  }
}

export async function listMedia(opts: { kind?: string; search?: string } = {}) {
  const where: Record<string, unknown> = { deletedAt: null }
  if (opts.kind === "image" || opts.kind === "video") where.kind = opts.kind
  if (opts.search) {
    where.OR = [
      { filename: { contains: opts.search, mode: "insensitive" } },
      { alt: { contains: opts.search, mode: "insensitive" } },
      { url: { contains: opts.search, mode: "insensitive" } },
    ]
  }
  return prisma.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 })
}

export async function registerUrl(
  input: { url: string; kind?: string; alt?: string; caption?: string },
  actor: { actorId: string; actorRole: string }
) {
  const url = (input.url ?? "").trim()
  if (!isValidHref(url) || url.startsWith("#")) {
    throw new MediaError("Enter a valid image or video URL (http(s) or site-relative).")
  }
  const kind = input.kind === "video" ? "video" : "image"
  const existing = await prisma.mediaAsset.findUnique({ where: { url } })
  if (existing && !existing.deletedAt) {
    throw new MediaError("That URL is already in the library.", "DUPLICATE")
  }
  const asset = existing
    ? await prisma.mediaAsset.update({
        where: { url },
        data: { deletedAt: null, kind, alt: input.alt ?? null, caption: input.caption ?? null },
      })
    : await prisma.mediaAsset.create({
        data: {
          url,
          kind,
          source: "url",
          alt: input.alt ?? null,
          caption: input.caption ?? null,
          filename: url.split("/").pop() || null,
          createdBy: actor.actorId,
        },
      })
  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "media.register_url",
    targetType: "MediaAsset",
    targetId: asset.id,
    metadata: { url },
  })
  return asset
}

export async function recordUpload(
  input: {
    url: string
    filename: string
    kind: "image" | "video"
    mimeType: string
    sizeBytes: number
  },
  actor: { actorId: string; actorRole: string }
) {
  const asset = await prisma.mediaAsset.create({
    data: {
      url: input.url,
      filename: input.filename,
      kind: input.kind,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      source: "upload",
      createdBy: actor.actorId,
    },
  })
  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "media.upload",
    targetType: "MediaAsset",
    targetId: asset.id,
    metadata: { url: input.url, sizeBytes: input.sizeBytes, mimeType: input.mimeType },
  })
  return asset
}

export async function updateMedia(
  id: string,
  patch: { alt?: string; caption?: string },
  actor: { actorId: string; actorRole: string }
) {
  const existing = await prisma.mediaAsset.findUnique({ where: { id } })
  if (!existing) throw new MediaError("Asset not found", "NOT_FOUND")
  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: { alt: patch.alt ?? existing.alt, caption: patch.caption ?? existing.caption },
  })
  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: "media.update",
    targetType: "MediaAsset",
    targetId: id,
  })
  return asset
}

/** Best-effort scan of everywhere the app stores media URLs. */
export async function findUsage(url: string): Promise<UsageRef[]> {
  const refs: UsageRef[] = []
  try {
    const [productImages, productMedia, stories, storyBlocks, settings] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, images: { array_contains: url } },
        select: { id: true, name: true },
      }),
      prisma.productMedia.findMany({ where: { url }, select: { id: true, productId: true } }),
      prisma.story.findMany({
        where: {
          deletedAt: null,
          OR: [{ coverImageUrl: url }, { mobileCoverUrl: url }, { socialImageUrl: url }],
        },
        select: { id: true, title: true },
      }),
      prisma.storyBlock.findMany({
        where: { type: "image", data: { path: ["url"], equals: url } },
        select: { id: true, storyId: true },
      }),
      prisma.siteSetting.findMany({ where: { value: { equals: url } }, select: { key: true } }),
    ])
    for (const p of productImages) refs.push({ type: "Product", id: p.id, label: p.name })
    for (const m of productMedia) refs.push({ type: "Product media", id: m.productId, label: m.productId })
    for (const s of stories) refs.push({ type: "Story", id: s.id, label: s.title })
    for (const b of storyBlocks) refs.push({ type: "Story block", id: b.storyId, label: b.storyId })
    for (const s of settings) refs.push({ type: "Setting", id: s.key, label: s.key })
  } catch {
    // Best-effort: if a scan query fails, return what we have.
  }
  return refs
}

export async function deleteMedia(
  id: string,
  actor: { actorId: string; actorRole: string },
  force = false
) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } })
  if (!asset) throw new MediaError("Asset not found", "NOT_FOUND")
  const usage = await findUsage(asset.url)
  if (usage.length > 0 && !force) {
    throw new MediaError(
      `In use by ${usage.length} item(s). Remove those references first, or force-delete.`,
      "IN_USE"
    )
  }
  const updated = await prisma.mediaAsset.update({ where: { id }, data: { deletedAt: new Date() } })
  await writeAudit({
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    action: force && usage.length ? "media.delete_forced" : "media.delete",
    targetType: "MediaAsset",
    targetId: id,
    metadata: { url: asset.url, usageCount: usage.length },
  })
  return updated
}

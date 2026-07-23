// lib/stories/util.ts
// Pure helpers for the Journal CMS: slugs, publish-state visibility, block sanitisation.
// No DB access here so these can be unit-tested in isolation.
// NOTE: source is intentionally ASCII-only; invisible code points are handled via a codePoint
// check so no literal control/zero-width characters live in this file.

import {
  STORY_BLOCK_TYPES,
  type StoryBlockInput,
  type StoryBlockType,
  type StoryStatus,
} from "./types"

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Only http(s) and site-relative URLs are permitted. Blocks anything that could execute. */
export function isSafeUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false
  if (url.startsWith("/")) return true // site-relative
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function isInvisible(code: number): boolean {
  if (code <= 0x1f || code === 0x7f) return true // C0 controls + DEL
  if (code >= 0x200b && code <= 0x200f) return true // zero-width + bidi marks
  if (code === 0x2028 || code === 0x2029 || code === 0xfeff) return true // line/para sep + BOM
  return false
}

/** Strip tags + invisible chars and collapse whitespace. Text is stored plain; React escapes on render. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return ""
  const noTags = value.replace(/<[^>]*>/g, "")
  let out = ""
  for (const ch of noTags) {
    const code = ch.codePointAt(0)
    if (code !== undefined && isInvisible(code)) continue
    out += ch
  }
  return out.replace(/\s+/g, " ").trim()
}

export interface VisibilityInput {
  status: StoryStatus
  publishedAt: Date | null
  scheduledFor: Date | null
  unpublishAt: Date | null
  deletedAt: Date | null
}

/**
 * Server-clock authority for whether a story is publicly visible.
 * PUBLISHED, not soft-deleted, publish window has opened, unpublish window has not closed.
 */
export function isStoryVisible(story: VisibilityInput, now: Date = new Date()): boolean {
  if (story.deletedAt) return false
  if (story.status !== "PUBLISHED") return false
  const startsAt = story.publishedAt ?? story.scheduledFor
  if (startsAt && startsAt.getTime() > now.getTime()) return false
  if (story.unpublishAt && story.unpublishAt.getTime() <= now.getTime()) return false
  return true
}

/**
 * Validate + sanitise a single block. Returns a cleaned block or null to drop it.
 * Never trusts client-supplied HTML; unknown block types and unsafe URLs are rejected.
 */
export function sanitizeBlock(block: StoryBlockInput): StoryBlockInput | null {
  if (!block || typeof block !== "object") return null
  const type = block.type as StoryBlockType
  if (!STORY_BLOCK_TYPES.includes(type)) return null
  const position = Number.isFinite(block.position) ? Number(block.position) : 0
  const raw = (block.data ?? {}) as Record<string, unknown>

  switch (type) {
    case "heading": {
      const text = sanitizeText(raw.text)
      if (!text) return null
      const level = raw.level === 3 ? 3 : 2
      return { type, position, data: { text, level } }
    }
    case "paragraph": {
      const text = sanitizeText(raw.text)
      if (!text) return null
      return { type, position, data: { text } }
    }
    case "quote": {
      const text = sanitizeText(raw.text)
      if (!text) return null
      const attribution = sanitizeText(raw.attribution)
      return { type, position, data: attribution ? { text, attribution } : { text } }
    }
    case "image": {
      const url = typeof raw.url === "string" ? raw.url.trim() : ""
      if (!isSafeUrl(url)) return null
      return {
        type,
        position,
        data: {
          url,
          alt: sanitizeText(raw.alt),
          caption: sanitizeText(raw.caption),
        },
      }
    }
    case "divider":
      return { type, position, data: {} }
    case "product": {
      const productSlug = sanitizeText(raw.productSlug)
      if (!productSlug) return null
      return { type, position, data: { productSlug } }
    }
    case "button": {
      const label = sanitizeText(raw.label)
      const href = typeof raw.href === "string" ? raw.href.trim() : ""
      if (!label || !isSafeUrl(href)) return null
      return { type, position, data: { label, href } }
    }
    default:
      return null
  }
}

export function sanitizeBlocks(blocks: StoryBlockInput[] | undefined): StoryBlockInput[] {
  if (!Array.isArray(blocks)) return []
  return blocks
    .map(sanitizeBlock)
    .filter((b): b is StoryBlockInput => b !== null)
    .map((b, i) => ({ ...b, position: i }))
}

/** Legal admin status transitions. */
const ALLOWED_TRANSITIONS: Record<StoryStatus, StoryStatus[]> = {
  DRAFT: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  ARCHIVED: ["ARCHIVED", "DRAFT", "PUBLISHED"],
}

export function canTransition(from: StoryStatus, to: StoryStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

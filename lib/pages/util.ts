import type { StoryBlockInput } from "@/lib/stories/types"
import { sanitizeBlocks, sanitizeText, slugify } from "@/lib/stories/util"

const PAGE_BLOCK_TYPES = new Set(["heading", "paragraph", "quote", "image", "divider", "button"])

export function normalizePageSlug(value: string): string {
  return value
    .split("/")
    .map((part) => slugify(part))
    .filter(Boolean)
    .join("/")
}

export function sanitizePageBlocks(blocks: StoryBlockInput[] | undefined): StoryBlockInput[] {
  return sanitizeBlocks(blocks)
    .filter((block) => PAGE_BLOCK_TYPES.has(block.type))
    .map((block, position) => ({ ...block, position }))
}

export function sanitizePageText(value: unknown, max: number): string | null {
  const cleaned = sanitizeText(value).slice(0, max)
  return cleaned || null
}

export interface PageVisibilityInput {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  publishedAt: Date | null
  scheduledFor: Date | null
  unpublishAt: Date | null
  deletedAt: Date | null
}

export function isPageVisible(page: PageVisibilityInput, now = new Date()): boolean {
  if (page.deletedAt || page.status !== "PUBLISHED") return false
  const startsAt = page.publishedAt ?? page.scheduledFor
  if (startsAt && startsAt > now) return false
  return !page.unpublishAt || page.unpublishAt > now
}

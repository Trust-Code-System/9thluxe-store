// lib/stories/types.ts
// Typed content model for the Journal / storytelling CMS.
// Blocks are structured (no raw HTML is stored) so rendering is safe by construction.

export const STORY_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "quote",
  "image",
  "divider",
  "product",
  "button",
] as const

export type StoryBlockType = (typeof STORY_BLOCK_TYPES)[number]

export type StoryBlockData =
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "divider" }
  | { type: "product"; productSlug: string }
  | { type: "button"; label: string; href: string }

export interface StoryBlockInput {
  type: StoryBlockType
  position: number
  data: Record<string, unknown>
}

export type StoryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export interface StoryInput {
  slug?: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  category?: string | null
  readTime?: string | null
  author?: string | null
  tags?: string | null
  coverImageUrl?: string | null
  mobileCoverUrl?: string | null
  socialImageUrl?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  featured?: boolean
  position?: number
  status?: StoryStatus
  scheduledFor?: string | null
  unpublishAt?: string | null
  blocks?: StoryBlockInput[]
  relatedProductIds?: string[]
}

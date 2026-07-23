import type { StoryBlockInput } from "@/lib/stories/types"

export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export interface PageInput {
  slug?: string
  title: string
  eyebrow?: string | null
  excerpt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  status?: PageStatus
  scheduledFor?: string | null
  unpublishAt?: string | null
  blocks?: StoryBlockInput[]
}

import { prisma } from "@/lib/prisma"
import { StoryEditor, type StoryEditorInitial } from "@/components/admin/story-editor"

export const dynamic = "force-dynamic"

const EMPTY: StoryEditorInitial = {
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  category: "",
  readTime: "",
  author: "",
  tags: "",
  coverImageUrl: "",
  mobileCoverUrl: "",
  socialImageUrl: "",
  seoTitle: "",
  seoDescription: "",
  featured: false,
  position: 0,
  status: "DRAFT",
  scheduledFor: "",
  unpublishAt: "",
  blocks: [],
  relatedProductIds: [],
}

export default async function NewStoryPage() {
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

  return <StoryEditor mode="create" initial={EMPTY} products={products} />
}

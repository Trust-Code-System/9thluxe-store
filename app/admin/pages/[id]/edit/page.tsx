import { notFound } from "next/navigation"
import { getPageForAdmin } from "@/lib/pages/service"
import { PageEditor, type PageEditorInitial } from "@/components/admin/page-editor"

function localDate(value: Date | null) {
  if (!value) return ""
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  let page
  try { page = await getPageForAdmin((await params).id) } catch { notFound() }
  const initial: PageEditorInitial = {
    id: page.id, updatedAt: page.updatedAt.toISOString(), slug: page.slug, title: page.title,
    eyebrow: page.eyebrow ?? "", excerpt: page.excerpt ?? "", seoTitle: page.seoTitle ?? "",
    seoDescription: page.seoDescription ?? "", status: page.status,
    scheduledFor: localDate(page.scheduledFor), unpublishAt: localDate(page.unpublishAt),
    blocks: page.blocks.map((block) => ({ type: block.type as PageEditorInitial["blocks"][number]["type"], data: block.data as Record<string, string | number> })),
  }
  return <PageEditor initial={initial} mode="edit" />
}

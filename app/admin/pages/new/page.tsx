import { PageEditor, type PageEditorInitial } from "@/components/admin/page-editor"

const EMPTY: PageEditorInitial = { slug: "", title: "", eyebrow: "", excerpt: "", seoTitle: "", seoDescription: "", status: "DRAFT", scheduledFor: "", unpublishAt: "", blocks: [] }

export default function NewPage() { return <PageEditor initial={EMPTY} mode="create" /> }

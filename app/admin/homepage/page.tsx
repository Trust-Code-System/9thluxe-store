import { getHomepageLayout } from "@/lib/homepage/service"
import { HOMEPAGE_SECTIONS } from "@/lib/homepage/registry"
import { HomepageEditor } from "@/components/admin/homepage-editor"

export const dynamic = "force-dynamic"

export default async function AdminHomepagePage() {
  let sections: Awaited<ReturnType<typeof getHomepageLayout>>
  try {
    sections = await getHomepageLayout()
  } catch {
    sections = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Homepage</h1>
        <p className="text-muted-foreground">
          Reorder sections, show or hide them, and edit the copy. Leave a field blank to keep the
          built-in default. Products and fragrance families are managed elsewhere.
        </p>
      </div>
      <HomepageEditor initialSections={sections} catalogue={HOMEPAGE_SECTIONS} />
    </div>
  )
}

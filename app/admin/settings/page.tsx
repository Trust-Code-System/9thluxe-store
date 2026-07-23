import { getSiteSettings } from "@/lib/settings/service"
import { SETTINGS } from "@/lib/settings/schema"
import { SettingsForm } from "@/components/admin/settings-form"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  let values: Awaited<ReturnType<typeof getSiteSettings>>
  try {
    values = await getSiteSettings()
  } catch {
    values = {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Site settings</h1>
        <p className="text-muted-foreground">
          Brand, SEO defaults, announcement bar, social links, footer and contact details used
          across the storefront.
        </p>
      </div>
      <SettingsForm fields={SETTINGS} initialValues={values} />
    </div>
  )
}

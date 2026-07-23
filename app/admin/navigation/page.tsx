import { getNavigationForAdmin } from "@/lib/navigation/service"
import { NAV_LOCATIONS } from "@/lib/navigation/defaults"
import { NavigationEditor } from "@/components/admin/navigation-editor"

export const dynamic = "force-dynamic"

export default async function AdminNavigationPage() {
  let menus: Awaited<ReturnType<typeof getNavigationForAdmin>>
  try {
    menus = await getNavigationForAdmin()
  } catch {
    menus = {} as Awaited<ReturnType<typeof getNavigationForAdmin>>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Navigation</h1>
        <p className="text-muted-foreground">
          Manage the header and footer menus. Empty menus fall back to the built-in defaults until
          you add items.
        </p>
      </div>
      <NavigationEditor locations={NAV_LOCATIONS} initialMenus={menus} />
    </div>
  )
}

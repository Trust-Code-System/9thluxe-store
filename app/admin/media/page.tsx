import { listMedia } from "@/lib/media/service"
import { MediaLibrary } from "@/components/admin/media-library"

export const dynamic = "force-dynamic"

export default async function AdminMediaPage() {
  let assets: Awaited<ReturnType<typeof listMedia>> = []
  let loadError = false
  try {
    assets = await listMedia()
  } catch {
    loadError = true
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Media library</h1>
        <p className="text-muted-foreground">
          Upload images and videos, or register existing URLs. Reuse assets across products,
          stories and the homepage. Referenced assets are protected from deletion.
        </p>
      </div>
      <MediaLibrary initialAssets={assets} loadError={loadError} />
    </div>
  )
}

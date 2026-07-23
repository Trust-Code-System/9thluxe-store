import Link from "next/link"
import { Plus, Pencil } from "lucide-react"

import { listStories } from "@/lib/stories/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StoryRowActions } from "@/components/admin/story-row-actions"

export const dynamic = "force-dynamic"

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "PUBLISHED") return "default"
  if (status === "ARCHIVED") return "outline"
  return "secondary"
}

export default async function AdminStoriesPage() {
  let stories: Awaited<ReturnType<typeof listStories>> = []
  let loadError = false
  try {
    stories = await listStories({ includeDeleted: true })
  } catch {
    loadError = true
  }

  const active = stories.filter((s) => !s.deletedAt)
  const trashed = stories.filter((s) => s.deletedAt)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Journal</h1>
          <p className="text-muted-foreground">
            Create and publish editorial stories shown at <code>/journal</code>.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/stories/new">
            <Plus className="mr-2 h-4 w-4" />
            New story
          </Link>
        </Button>
      </div>

      {loadError && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            The Story tables could not be reached. If this environment has not yet had the
            <code className="mx-1">story_cms</code> migration applied, the public Journal will keep
            using the built-in articles until it is.
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Stories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {active.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              No stories yet. Create your first story, or run the seed script to import the existing
              journal articles.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {active.map((story) => (
                <div
                  key={story.id}
                  className="flex flex-wrap items-center gap-3 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/stories/${story.id}/edit`}
                        className="truncate font-medium hover:text-primary"
                      >
                        {story.title}
                      </Link>
                      {story.featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      /{story.slug} · {story._count.blocks} blocks ·{" "}
                      {story._count.relatedProducts} linked products
                      {story.scheduledFor && story.status === "DRAFT"
                        ? ` · scheduled ${new Date(story.scheduledFor).toLocaleString("en-NG")}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant={statusVariant(story.status)}>{story.status}</Badge>
                  <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Link href={`/admin/stories/${story.id}/edit`} aria-label="Edit story">
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <StoryRowActions
                    storyId={story.id}
                    slug={story.slug}
                    status={story.status}
                    deleted={false}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {trashed.length > 0 && (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Trash</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {trashed.map((story) => (
                <div key={story.id} className="flex items-center gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-muted-foreground line-through">
                      {story.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">/{story.slug}</p>
                  </div>
                  <StoryRowActions
                    storyId={story.id}
                    slug={story.slug}
                    status={story.status}
                    deleted
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

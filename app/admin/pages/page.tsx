import Link from "next/link"
import { Pencil, Plus } from "lucide-react"
import { listPages } from "@/lib/pages/service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageRowActions } from "@/components/admin/page-row-actions"

export const dynamic = "force-dynamic"

export default async function AdminPagesPage() {
  let pages: Awaited<ReturnType<typeof listPages>> = []
  let loadError = false
  try { pages = await listPages(true) } catch { loadError = true }
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="font-serif text-2xl font-semibold">Pages</h1><p className="text-muted-foreground">Manage about, FAQ, and help content. Privacy and terms remain source-controlled.</p></div>
        <Button asChild size="sm"><Link href="/admin/pages/new"><Plus className="mr-2 h-4 w-4" />New page</Link></Button>
      </div>
      {loadError && <Card className="border-amber-500/40"><CardContent className="py-4 text-sm text-muted-foreground">The Page tables are unavailable. Storefront routes continue to use their built-in content until the migration is applied and pages are published.</CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">Managed routes</CardTitle></CardHeader><CardContent className="p-0">
        {pages.length === 0 ? <p className="px-6 py-8 text-sm text-muted-foreground">No managed pages yet. Run the page seed after applying the migration, or create one here.</p> : <div className="divide-y divide-border">{pages.map((page) => <div key={page.id} className="flex items-center gap-3 px-6 py-4">
          <div className="min-w-0 flex-1"><Link href={`/admin/pages/${page.id}/edit`} className={`font-medium hover:text-primary ${page.deletedAt ? "line-through text-muted-foreground" : ""}`}>{page.title}</Link><p className="text-xs text-muted-foreground">/{page.slug} · {page._count.blocks} blocks</p></div>
          <Badge variant={page.status === "PUBLISHED" ? "default" : "secondary"}>{page.status}</Badge>
          {!page.deletedAt && <Button asChild variant="ghost" size="icon"><Link href={`/admin/pages/${page.id}/edit`} aria-label="Edit page"><Pencil className="h-4 w-4" /></Link></Button>}
          <PageRowActions id={page.id} deleted={Boolean(page.deletedAt)} />
        </div>)}</div>}
      </CardContent></Card>
    </div>
  )
}

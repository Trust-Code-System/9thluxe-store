import { prisma } from "@/lib/prisma"
import { RedirectManager } from "@/components/admin/redirect-manager"
export const dynamic = "force-dynamic"
export default async function RedirectsPage() { let redirects: Awaited<ReturnType<typeof prisma.redirect.findMany>> = []; try { redirects = await prisma.redirect.findMany({ orderBy: { source: "asc" } }) } catch {} return <div className="space-y-6"><div><h1 className="font-serif text-2xl font-semibold">SEO redirects</h1><p className="text-muted-foreground">Preserve links and search equity when public URLs change.</p></div><RedirectManager redirects={redirects} /></div> }

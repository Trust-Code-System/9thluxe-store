import { notFound, permanentRedirect, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function RedirectResolver({ params }: { params: Promise<{ path: string[] }> }) {
  const source = `/${(await params).path.join("/")}`
  let item = null
  try {
    item = await prisma.redirect.findUnique({ where: { source } })
  } catch {}
  if (!item?.active) notFound()
  if (item.permanent) permanentRedirect(item.destination)
  redirect(item.destination)
}

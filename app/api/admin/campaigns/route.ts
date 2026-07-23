import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { saveCampaign, saveCoupon } from "@/lib/campaigns/service"

export async function GET() {
  const authz = await getAuthorizedUser("marketing:manage"); if (!authz.ok) return NextResponse.json({ error: "Forbidden" }, { status: authz.status })
  const [campaigns, coupons, products] = await Promise.all([prisma.campaign.findMany({ include: { products: true }, orderBy: { createdAt: "desc" } }), prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }), prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, name: true } })])
  return NextResponse.json({ campaigns, coupons, products })
}
export async function POST(request: NextRequest) {
  const authz = await getAuthorizedUser("marketing:manage"); if (!authz.ok) return NextResponse.json({ error: "Forbidden" }, { status: authz.status })
  try { const body = await request.json(); const actor = { actorId: authz.user.id, actorRole: authz.user.role }; return NextResponse.json(body.kind === "coupon" ? { coupon: await saveCoupon(body, actor) } : { campaign: await saveCampaign(body, actor) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Save failed" }, { status: 400 }) }
}

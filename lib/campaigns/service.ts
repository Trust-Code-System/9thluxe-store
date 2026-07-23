import { prisma } from "@/lib/prisma"
import { isSafeUrl, sanitizeText, slugify } from "@/lib/stories/util"
import { writeAudit } from "@/lib/audit"

export async function getActiveCampaign(now = new Date()) {
  try { return await prisma.campaign.findFirst({ where: { status: "PUBLISHED", AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] }, include: { products: { orderBy: { position: "asc" }, include: { product: true } }, coupon: true }, orderBy: { startsAt: "desc" } }) } catch { return null }
}

export async function saveCampaign(body: Record<string, unknown>, actor: { actorId: string; actorRole: string }) {
  const title = sanitizeText(body.title)
  const slug = slugify(typeof body.slug === "string" ? body.slug : title)
  if (!title || !slug) throw new Error("Title is required")
  const safe = (value: unknown) => typeof value === "string" && value.trim() && isSafeUrl(value.trim()) ? value.trim() : null
  const productIds = Array.isArray(body.productIds) ? [...new Set(body.productIds.filter((id): id is string => typeof id === "string"))] : []
  const data = {
    slug, title, description: sanitizeText(body.description) || null,
    desktopImage: safe(body.desktopImage), mobileImage: safe(body.mobileImage),
    ctaLabel: sanitizeText(body.ctaLabel) || null, ctaHref: safe(body.ctaHref),
    status: body.status === "PUBLISHED" ? "PUBLISHED" as const : "DRAFT" as const,
    startsAt: typeof body.startsAt === "string" && body.startsAt ? new Date(body.startsAt) : null,
    endsAt: typeof body.endsAt === "string" && body.endsAt ? new Date(body.endsAt) : null,
    couponId: typeof body.couponId === "string" && body.couponId ? body.couponId : null,
  }
  const id = typeof body.id === "string" ? body.id : null
  const campaign = await prisma.$transaction(async (tx) => {
    const saved = id ? await tx.campaign.update({ where: { id }, data }) : await tx.campaign.create({ data: { ...data, createdBy: actor.actorId } })
    await tx.campaignProduct.deleteMany({ where: { campaignId: saved.id } })
    if (productIds.length) await tx.campaignProduct.createMany({ data: productIds.map((productId, position) => ({ campaignId: saved.id, productId, position })) })
    return saved
  })
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: id ? "campaign.update" : "campaign.create", targetType: "Campaign", targetId: campaign.id, metadata: { slug, status: campaign.status } })
  return campaign
}

export async function saveCoupon(body: Record<string, unknown>, actor: { actorId: string; actorRole: string }) {
  const code = sanitizeText(body.code).toUpperCase()
  const type = body.type === "FIXED" ? "FIXED" : "PERCENT"
  const value = Number(body.value)
  if (!code || !Number.isInteger(value) || value <= 0 || (type === "PERCENT" && value > 100)) throw new Error("Enter a valid code and value")
  const id = typeof body.id === "string" ? body.id : null
  const data = { code, type, value, startsAt: new Date(String(body.startsAt)), endsAt: new Date(String(body.endsAt)), maxUses: body.maxUses ? Number(body.maxUses) : null, minSubtotal: body.minSubtotal ? Number(body.minSubtotal) : null, active: body.active !== false }
  if (Number.isNaN(data.startsAt.getTime()) || Number.isNaN(data.endsAt.getTime()) || data.endsAt <= data.startsAt) throw new Error("Enter a valid coupon window")
  const coupon = id ? await prisma.coupon.update({ where: { id }, data }) : await prisma.coupon.create({ data })
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: id ? "coupon.update" : "coupon.create", targetType: "Coupon", targetId: coupon.id, metadata: { code } })
  return coupon
}

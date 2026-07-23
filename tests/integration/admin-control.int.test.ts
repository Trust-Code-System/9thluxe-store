import { afterAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/prisma"
import { createStory, updateStory } from "@/lib/stories/service"
import { createPage } from "@/lib/pages/service"
import { listRevisions } from "@/lib/revisions/service"
import { runScheduledPublishing } from "@/lib/publishing/service"
import { createContactSubmission, updateFormSubmission } from "@/lib/forms/submissions"
import { getActiveCampaign, saveCampaign, saveCoupon } from "@/lib/campaigns/service"
import { resolveEmailTemplate } from "@/lib/email-templates/service"

const tag = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const actor = { actorId: tag, actorRole: "SUPER_ADMIN" }
const ids: Record<string, string> = {}

afterAll(async () => {
  if (ids.campaign) await prisma.campaign.deleteMany({ where: { id: ids.campaign } })
  if (ids.coupon) await prisma.coupon.deleteMany({ where: { id: ids.coupon } })
  if (ids.story) await prisma.story.deleteMany({ where: { id: ids.story } })
  if (ids.page) await prisma.page.deleteMany({ where: { id: ids.page } })
  if (ids.expiredPage) await prisma.page.deleteMany({ where: { id: ids.expiredPage } })
  if (ids.submission) await prisma.formSubmission.deleteMany({ where: { id: ids.submission } })
  await prisma.redirect.deleteMany({ where: { source: `/${tag}` } })
  await prisma.emailTemplate.deleteMany({ where: { key: tag } })
  await prisma.auditLog.deleteMany({ where: { actorId: tag } })
  await prisma.$disconnect()
})

describe("admin-control database flow", () => {
  it("persists revisions and promotes or archives scheduled content", async () => {
    const story = await createStory(
      {
        title: `${tag} story`,
        status: "DRAFT",
        blocks: [{ type: "paragraph", position: 0, data: { text: "Original" } }],
      },
      actor
    )
    ids.story = story.id

    await updateStory(
      story.id,
      {
        title: `${tag} story updated`,
        status: "DRAFT",
        blocks: [{ type: "paragraph", position: 0, data: { text: "Updated" } }],
      },
      actor,
      story.updatedAt.toISOString()
    )
    expect(await listRevisions("Story", story.id)).toHaveLength(1)

    await prisma.story.update({
      where: { id: story.id },
      data: { status: "DRAFT", scheduledFor: new Date(Date.now() - 60_000) },
    })

    const page = await createPage({ slug: `/${tag}`, title: `${tag} page` }, actor)
    ids.page = page.id
    await prisma.page.update({
      where: { id: page.id },
      data: { status: "DRAFT", scheduledFor: new Date(Date.now() - 60_000) },
    })
    const expiredPage = await createPage({ slug: `/${tag}-expired`, title: "Expired page" }, actor)
    ids.expiredPage = expiredPage.id
    await prisma.page.update({
      where: { id: expiredPage.id },
      data: { status: "PUBLISHED", publishedAt: new Date(Date.now() - 120_000), unpublishAt: new Date(Date.now() - 60_000) },
    })

    const result = await runScheduledPublishing(new Date(), tag)
    expect(result).toMatchObject({ publishedStories: 1, publishedPages: 1, unpublishedPages: 1 })
    expect((await prisma.story.findUniqueOrThrow({ where: { id: story.id } })).status).toBe("PUBLISHED")
    expect((await prisma.page.findUniqueOrThrow({ where: { id: page.id } })).status).toBe("PUBLISHED")
    expect((await prisma.page.findUniqueOrThrow({ where: { id: expiredPage.id } })).status).toBe("ARCHIVED")
  }, 30_000)

  it("persists and resolves enquiries, campaigns, redirects and email overrides", async () => {
    const submission = await createContactSubmission({
      name: "Verification User",
      email: `${tag}@example.test`,
      subject: "Verification",
      message: "Please verify persistence",
    })
    ids.submission = submission.id
    const resolved = await updateFormSubmission(
      submission.id,
      { status: "RESOLVED", notes: "Verified" },
      actor
    )
    expect(resolved.resolvedAt).toBeInstanceOf(Date)

    const coupon = await saveCoupon(
      {
        code: tag.replace(/-/g, "").toUpperCase(),
        type: "PERCENT",
        value: 10,
        startsAt: new Date(Date.now() - 60_000).toISOString(),
        endsAt: new Date(Date.now() + 60_000).toISOString(),
      },
      actor
    )
    ids.coupon = coupon.id
    const campaign = await saveCampaign(
      {
        title: `${tag} campaign`,
        status: "PUBLISHED",
        startsAt: new Date(Date.now() - 60_000).toISOString(),
        endsAt: new Date(Date.now() + 60_000).toISOString(),
        couponId: coupon.id,
        ctaHref: "/drops",
      },
      actor
    )
    ids.campaign = campaign.id
    expect((await getActiveCampaign())?.id).toBe(campaign.id)

    await prisma.redirect.create({
      data: { source: `/${tag}`, destination: "/about", createdBy: tag },
    })
    expect((await prisma.redirect.findUniqueOrThrow({ where: { source: `/${tag}` } })).destination).toBe("/about")

    await prisma.emailTemplate.create({
      data: {
        key: tag,
        name: "Verification",
        subject: "Hello {{customerName}}",
        bodyText: "Order {{orderRef}} for {{customerName}}",
        enabled: true,
        updatedBy: tag,
      },
    })
    const rendered = await resolveEmailTemplate(
      tag,
      { customerName: "<Fádé>", orderRef: "9CH-1" },
      "fallback",
      "fallback"
    )
    expect(rendered.subject).toBe("Hello <Fádé>")
    expect(rendered.html).toContain("&lt;Fádé&gt;")
    expect(rendered.html).toContain("9CH-1")

    expect(await prisma.auditLog.count({ where: { actorId: tag } })).toBeGreaterThanOrEqual(6)
  }, 15_000)
})

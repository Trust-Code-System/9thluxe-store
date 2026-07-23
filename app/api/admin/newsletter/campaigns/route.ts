import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthorizedUser } from "@/lib/authz"

export const runtime = "nodejs"

// GET - List all campaigns
export async function GET(_request: NextRequest) {
  try {
    const authz = await getAuthorizedUser("marketing:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })

    const campaigns = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
        sentAt: campaign.sentAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error("Get campaigns error:", error)
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const authz = await getAuthorizedUser("marketing:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })

    const { subject, html, text, status = "DRAFT" } = await request.json()

    if (!subject || !html) {
      return NextResponse.json(
        { error: "Subject and HTML content are required" },
        { status: 400 }
      )
    }

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject,
        html,
        text: text || "",
        status: status as "DRAFT" | "SCHEDULED" | "SENT",
      },
    })

    return NextResponse.json({
      campaign: {
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
        sentAt: campaign.sentAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error("Create campaign error:", error)
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    )
  }
}

// PATCH - Update campaign
export async function PATCH(request: NextRequest) {
  try {
    const authz = await getAuthorizedUser("marketing:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })

    const { id, subject, html, text, status } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (subject !== undefined) updateData.subject = subject
    if (html !== undefined) updateData.html = html
    if (text !== undefined) updateData.text = text
    if (status !== undefined) updateData.status = status

    const campaign = await prisma.newsletterCampaign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      campaign: {
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
        sentAt: campaign.sentAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error("Update campaign error:", error)
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthorizedUser } from "@/lib/authz"

export const runtime = "nodejs"

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getAuthorizedUser("marketing:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
    const { id } = await params

    await prisma.newsletterCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete campaign error:", error)
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    )
  }
}

// GET - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await getAuthorizedUser("marketing:manage")
    if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
    const { id } = await params

    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
        sentAt: campaign.sentAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error("Get campaign error:", error)
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    )
  }
}


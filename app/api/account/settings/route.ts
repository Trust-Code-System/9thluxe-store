import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        marketingEmails: true,
        orderUpdates: true,
        wishlistAlerts: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse name into first and last name
    const nameParts = user.name?.split(" ") || []
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    return NextResponse.json({
      firstName,
      lastName,
      email: user.email,
      phone: "", // Phone would need to be added to schema
      orderUpdates: user.orderUpdates ?? true,
      promotionalEmails: user.marketingEmails ?? true,
      wishlistAlerts: user.wishlistAlerts ?? false,
    })
  } catch (error: any) {
    console.error("Settings fetch error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone: _phone, orderUpdates, promotionalEmails, wishlistAlerts } = body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user profile
    // Note: The schema might need a phone field, but for now we'll update what we can
    const name = firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || user.name

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        marketingEmails: promotionalEmails ?? user.marketingEmails,
        orderUpdates: orderUpdates ?? user.orderUpdates ?? true,
        wishlistAlerts: wishlistAlerts ?? user.wishlistAlerts ?? false,
        // Note: phone would need to be added to the schema
      } as any,
    })

    return NextResponse.json({
      message: "Settings updated successfully",
    })
  } catch (error: any) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 },
    )
  }
}


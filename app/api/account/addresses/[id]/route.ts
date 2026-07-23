import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { NIGERIAN_STATES } from "@/lib/constants/nigerian-states"
import { consumeRateLimit } from "@/lib/middleware/limiter"
import { hasTrustedOrigin } from "@/lib/security/origin"

const addressSchema = z.object({
  name: z.string().min(1, "Full name is required").max(200),
  line1: z.string().min(1, "Address line is required").max(500).optional(),
  address: z.string().min(1, "Address line is required").max(500).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.enum(NIGERIAN_STATES as unknown as [string, ...string[]], { message: "Select a valid state" }),
  postalCode: z.string().max(20).optional().nullable(),
  phone: z.string().min(10, "Enter a valid phone number").max(20).regex(/^[\d\s+\-()]+$/, "Invalid phone format"),
  isDefault: z.boolean().optional(),
}).refine((d) => d.line1 || d.address, { message: "Address line is required", path: ["line1"] })

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }
    const { id } = await params
    const address = await prisma.address.findFirst({
      where: { id, userId: user.id },
    })
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const a = address as typeof address & { name?: string | null; postalCode?: string | null }
    return NextResponse.json({
      address: {
        id: a.id,
        name: a.name ?? "",
        address: a.line1,
        line1: a.line1,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode ?? "",
        phone: a.phone,
        isDefault: a.isDefault,
      },
    })
  } catch (error) {
    console.error("Address GET error:", error)
    return NextResponse.json({ error: "Failed to load address" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }
    const limit = await consumeRateLimit(
      `account:address:${user.id}`,
      30,
      60 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many address changes" }, { status: 429 })
    }

    const { id } = await params
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = addressSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ")
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, line1, address: addressLine, city, state, postalCode, phone, isDefault } = parsed.data
    const line1Value = line1 ?? addressLine

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        })
      }
      return tx.address.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name || null }),
          ...(line1Value !== undefined &&
            line1Value !== "" && { line1: line1Value }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(postalCode !== undefined && {
            postalCode: postalCode || null,
          }),
          ...(phone !== undefined && { phone }),
          ...(isDefault !== undefined && { isDefault }),
        },
      })
    })

    const a = address as typeof address & { name?: string | null; postalCode?: string | null }
    return NextResponse.json({
      address: {
        id: a.id,
        name: a.name ?? "",
        address: a.line1,
        line1: a.line1,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode ?? "",
        phone: a.phone,
        isDefault: a.isDefault,
      },
    })
  } catch (error) {
    console.error("Address PATCH error:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }
    const limit = await consumeRateLimit(
      `account:address:${user.id}`,
      30,
      60 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many address changes" }, { status: 429 })
    }

    const { id } = await params
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    await prisma.address.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Address DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}

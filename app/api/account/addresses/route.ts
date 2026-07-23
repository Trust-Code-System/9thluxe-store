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
  isDefault: z.boolean().optional().default(false),
}).refine((d) => d.line1 || d.address, { message: "Address line is required", path: ["line1"] })

export async function GET() {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    type AddressRow = typeof addresses[0] & { name?: string | null; postalCode?: string | null }
    const list = addresses.map((a: AddressRow) => ({
      id: a.id,
      name: a.name ?? "",
      address: a.line1,
      line1: a.line1,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode ?? "",
      phone: a.phone,
      isDefault: a.isDefault,
    }))

    return NextResponse.json({ addresses: list })
  } catch (error) {
    console.error("Addresses GET error:", error)
    return NextResponse.json({ error: "Failed to load addresses" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const limit = await consumeRateLimit(
      `account:address:${user.id}`,
      30,
      60 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many address changes. Please try again later." },
        { status: 429 },
      )
    }

    const body = await req.json()
    const parsed = addressSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ")
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, line1, address: addressLine, city, state, postalCode, phone, isDefault } = parsed.data
    const line1Value = line1 ?? addressLine ?? ""

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        })
      }
      return tx.address.create({
        data: {
          userId: user.id,
          name: name || null,
          line1: line1Value,
          city,
          state,
          postalCode: postalCode || null,
          phone,
          isDefault: isDefault ?? false,
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
    console.error("Address POST error:", error)
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
  }
}

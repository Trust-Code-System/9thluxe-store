import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createOrderSchema = z.object({
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  phone: z.string().min(10, "Phone is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
      priceNGN: z.number().int().min(0),
    })
  ).min(1, "Cart is empty"),
  subtotalNGN: z.number().int().min(0),
  discountNGN: z.number().int().min(0).default(0),
  shippingNGN: z.number().int().min(0),
  totalNGN: z.number().int().min(0),
  couponId: z.string().optional().nullable(),
  isGift: z.boolean().optional().default(false),
  giftMessage: z.string().max(500).optional().nullable(),
  giftWrapping: z.boolean().optional().default(false),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER"]).optional().default("CARD"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Sign in to checkout" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ")
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { addressLine1, city, state, phone, items, subtotalNGN: _subtotalNGN, discountNGN, shippingNGN, totalNGN, couponId, isGift, giftMessage, giftWrapping, paymentMethod } = parsed.data

    // Resolve product IDs and validate prices (use DB price for consistency)
    const productIds = [...new Set(items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, priceNGN: true, stock: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const orderItems: { productId: string; quantity: number; priceNGN: number }[] = []
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 })
      }
      if (item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.productId}. Max: ${product.stock}` },
          { status: 400 }
        )
      }
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceNGN: product.priceNGN,
      })
    }

    const computedSubtotal = orderItems.reduce((s, i) => s + i.priceNGN * i.quantity, 0)
    const orderTotal = computedSubtotal - discountNGN + shippingNGN
    if (orderTotal !== totalNGN) {
      return NextResponse.json(
        { error: "Total mismatch. Please refresh and try again." },
        { status: 400 }
      )
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: "PENDING",
        subtotalNGN: computedSubtotal,
        discountNGN,
        shippingNGN,
        totalNGN: orderTotal,
        couponId: couponId || null,
        addressLine1,
        city,
        state,
        phone,
        isGift: isGift ?? false,
        giftMessage: giftMessage || null,
        giftWrapping: giftWrapping ?? false,
        paymentMethod: paymentMethod ?? "CARD",
        items: {
          create: orderItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            priceNGN: i.priceNGN,
          })),
        },
      },
    })

    return NextResponse.json({ orderId: order.id })
  } catch (e) {
    console.error("Create order error:", e)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
